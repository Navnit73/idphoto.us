import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import { imageSize } from "image-size";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type Heading = { depth: 2 | 3 | 4; id: string; text: string };

export type ParsedMarkdown = {
  tree: Root;
  headings: Heading[];
  internalLinks: string[];
  wordCount: number;
};

// Raw HTML in Markdown is dropped (remark-rehype's default), so content can't inject markup.
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSlug);

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Parses Markdown into a serializable HTML AST and enforces the content rules
 * that keep pages semantic: no H1 in the body (templates render the only H1),
 * no skipped heading levels, local images with alt text.
 */
export async function parseMarkdown(markdown: string, { allowHeadings = true } = {}): Promise<ParsedMarkdown> {
  const tree = (await processor.run(processor.parse(markdown))) as Root;
  const problems: string[] = [];
  const headings: Heading[] = [];
  const internalLinks: string[] = [];
  let previousDepth = 1;

  visit(tree, (node) => {
    delete node.position;
  });

  visit(tree, "element", (node, index, parent) => {
    const depth = /^h([1-6])$/.exec(node.tagName)?.[1];
    if (depth) {
      const level = Number(depth);
      const text = toString(node).trim();
      if (!allowHeadings) problems.push(`Heading "${text}" is not allowed here`);
      if (level === 1) problems.push(`H1 "${text}" found — the template renders the page's only H1; start at ##`);
      if (level > previousDepth + 1) problems.push(`Heading "${text}" skips from H${previousDepth} to H${level}`);
      if (level >= 5) problems.push(`Heading "${text}" is H${level}; use H2–H4`);
      previousDepth = level;
      if (level >= 2 && level <= 4) headings.push({ depth: level as Heading["depth"], id: String(node.properties.id), text });
    }

    if (node.tagName === "a") {
      const href = String(node.properties.href ?? "");
      if (href.startsWith("/")) internalLinks.push(href.split(/[?#]/)[0].replace(/\/$/, "") || "/");
      if (!toString(node).trim()) problems.push(`Link to ${href} has no text`);
    }

    if (node.tagName === "img") {
      const src = String(node.properties.src ?? "");
      if (!String(node.properties.alt ?? "").trim()) problems.push(`Image ${src} is missing alt text`);
      if (!src.startsWith("/")) {
        problems.push(`Image ${src} must be a local /public path`);
      } else {
        try {
          const { width, height } = imageSize(readFileSync(path.join(PUBLIC_DIR, src)));
          node.properties.width = width;
          node.properties.height = height;
        } catch {
          problems.push(`Image ${src} was not found in /public`);
        }
      }
      // A paragraph holding only an image becomes a <figure>, captioned by the image title.
      if (parent?.type === "element" && parent.tagName === "p" && index !== undefined) {
        const meaningful = parent.children.filter((child) => !(child.type === "text" && !child.value.trim()));
        if (meaningful.length === 1) {
          const caption = node.properties.title ? String(node.properties.title) : undefined;
          delete node.properties.title;
          const figure = parent as Element;
          figure.tagName = "figure";
          figure.children = [node, ...(caption ? [figcaption(caption)] : [])];
        }
      }
    }
  });

  if (problems.length) throw new Error(problems.join("\n"));

  const wordCount = toString(tree).split(/\s+/).filter(Boolean).length;
  return { tree, headings, internalLinks, wordCount };
}

function figcaption(text: string): ElementContent {
  return { type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: text }] };
}
