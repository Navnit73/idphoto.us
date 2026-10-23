import "server-only";

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import type { Root } from "hast";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

import { parseMarkdown, type Heading } from "./markdown";
import {
  authorSchema,
  CATEGORY_DIRECTORIES,
  CATEGORY_ROUTE_PREFIX,
  frontmatterSchema,
  MIN_WORDS,
  type Author,
  type Frontmatter,
} from "./schema";

export type PageSummary = {
  path: string;
  title: string;
  heading: string;
  description: string;
  category: Frontmatter["category"];
  template: Frontmatter["template"];
  breadcrumbLabel: string;
  updatedAt: string;
  indexable: boolean;
  /** Absolute canonical path or URL; equals `path` unless overridden. */
  canonical: string;
  inSitemap: boolean;
};

export type Page = PageSummary & {
  frontmatter: Frontmatter;
  sourceFile: string;
  tree: Root;
  headings: Heading[];
  wordCount: number;
  readingMinutes: number;
  faq: { question: string; answer: Root }[];
  author: Author;
  reviewer: Author | null;
  related: PageSummary[];
};

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * In development the cache key includes the newest content mtime so edits to
 * Markdown show up on refresh. Production builds read content exactly once.
 */
function contentVersion() {
  if (process.env.NODE_ENV === "production") return "build";
  let latest = 0;
  for (const file of listFiles(CONTENT_DIR)) latest = Math.max(latest, statSync(file).mtimeMs);
  return String(latest);
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function loadAuthors(): Map<string, Author> {
  const raw = JSON.parse(readFileSync(path.join(CONTENT_DIR, "authors.json"), "utf8"));
  const parsed = z.record(z.string(), authorSchema).parse(raw);
  return new Map(Object.entries(parsed).map(([id, author]) => [id, { ...author, id }]));
}

function routePath(frontmatter: Frontmatter) {
  const prefix = CATEGORY_ROUTE_PREFIX[frontmatter.category];
  return frontmatter.slug ? `${prefix}/${frontmatter.slug}` : prefix;
}

function summarize(page: Omit<Page, "related">): PageSummary {
  const { path, title, heading, description, category, template, breadcrumbLabel, updatedAt, indexable, canonical, inSitemap } =
    page;
  return { path, title, heading, description, category, template, breadcrumbLabel, updatedAt, indexable, canonical, inSitemap };
}

/**
 * Reads, parses, and validates every Markdown page. Any content problem —
 * bad frontmatter, duplicate titles, broken internal links, thin indexable
 * pages, conflicting canonicals — throws, failing the build with the file name.
 */
async function loadAllPages(version: string): Promise<Page[]> {
  "use cache";
  cacheLife("max");
  void version;

  const authors = loadAuthors();
  const errors: string[] = [];
  const pages: Omit<Page, "related">[] = [];
  const internalLinks = new Map<string, string[]>();

  for (const [directory, category] of Object.entries(CATEGORY_DIRECTORIES)) {
    const dir = path.join(CONTENT_DIR, directory);
    const files = listFiles(dir).filter((file) => /\.mdx?$/.test(file));

    for (const file of files) {
      const sourceFile = path.relative(process.cwd(), file);
      try {
        const { data, content } = matter(readFileSync(file, "utf8"));
        const result = frontmatterSchema.safeParse(data);
        if (!result.success) throw new Error(z.prettifyError(result.error));
        const frontmatter = result.data;

        if (frontmatter.category !== category) {
          throw new Error(`category "${frontmatter.category}" doesn't match its folder content/${directory}/`);
        }
        if (!frontmatter.published) continue;

        const author = authors.get(frontmatter.author);
        if (!author) throw new Error(`unknown author "${frontmatter.author}" (see content/authors.json)`);
        const reviewer = frontmatter.reviewedBy ? authors.get(frontmatter.reviewedBy) : null;
        if (reviewer === undefined) throw new Error(`unknown reviewer "${frontmatter.reviewedBy}"`);

        const body = await parseMarkdown(content);
        const parsedFaq = await Promise.all(
          frontmatter.faq.map(async (item) => ({ item, answer: await parseMarkdown(item.answer, { allowHeadings: false }) })),
        );
        const faq = parsedFaq.map(({ item, answer }) => ({ question: item.question, answer: answer.tree }));
        // Visible FAQ answers are real page content, so they count toward the thin-content check.
        const wordCount =
          body.wordCount + parsedFaq.reduce((sum, { item, answer }) => sum + answer.wordCount + item.question.split(/\s+/).length, 0);
        const faqLinks = parsedFaq.flatMap(({ answer }) => answer.internalLinks);

        const pagePath = routePath(frontmatter);
        const canonical = frontmatter.canonical ?? pagePath;
        const indexable = frontmatter.indexable;

        pages.push({
          path: pagePath,
          title: frontmatter.title,
          heading: frontmatter.heading ?? frontmatter.title,
          description: frontmatter.description,
          category: frontmatter.category,
          template: frontmatter.template,
          breadcrumbLabel: frontmatter.breadcrumbLabel ?? frontmatter.heading ?? frontmatter.title,
          updatedAt: frontmatter.updatedAt,
          indexable,
          canonical,
          inSitemap: indexable && canonical === pagePath,
          frontmatter,
          sourceFile,
          tree: body.tree,
          headings: body.headings,
          wordCount,
          readingMinutes: Math.max(1, Math.round(wordCount / 225)),
          faq,
          author,
          reviewer,
        });

        internalLinks.set(sourceFile, [...body.internalLinks, ...faqLinks]);
      } catch (error) {
        errors.push(`${sourceFile}:\n  ${String(error instanceof Error ? error.message : error).replaceAll("\n", "\n  ")}`);
      }
    }
  }

  errors.push(...validateSite(pages, internalLinks));

  if (errors.length) {
    throw new Error(`Content validation failed (${errors.length}):\n\n${errors.join("\n\n")}`);
  }

  const byPath = new Map(pages.map((page) => [page.path, page]));
  return pages
    .map((page) => ({
      ...page,
      related: page.frontmatter.relatedPages.map((related) => summarize(byPath.get(related)!)),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Routes that exist outside the Markdown system and may be linked to. */
const CODE_ROUTES = new Set(["/"]);

function validateSite(pages: Omit<Page, "related">[], internalLinks: Map<string, string[]>): string[] {
  const errors: string[] = [];
  const byPath = new Map<string, Omit<Page, "related">>();

  for (const page of pages) {
    const existing = byPath.get(page.path);
    if (existing) errors.push(`${page.sourceFile}: path ${page.path} is also used by ${existing.sourceFile}`);
    byPath.set(page.path, page);
  }

  const exists = (target: string) => byPath.has(target) || CODE_ROUTES.has(target);

  for (const field of ["title", "description"] as const) {
    const seen = new Map<string, string>();
    for (const page of pages) {
      if (!page.indexable) continue;
      const key = page[field].toLowerCase();
      const other = seen.get(key);
      if (other) errors.push(`${page.sourceFile}: duplicate ${field} — also used by ${other}`);
      seen.set(key, page.sourceFile);
    }
  }

  for (const page of pages) {
    const { frontmatter, sourceFile } = page;
    const minimum = MIN_WORDS[page.template];
    if (page.indexable && page.wordCount < minimum) {
      errors.push(
        `${sourceFile}: thin content — ${page.wordCount} words, the ${page.template} template needs ${minimum}+ (or set indexable: false)`,
      );
    }

    for (const related of frontmatter.relatedPages) {
      if (related === page.path) errors.push(`${sourceFile}: relatedPages lists the page itself`);
      else if (!byPath.has(related)) errors.push(`${sourceFile}: relatedPages entry ${related} doesn't exist or is unpublished`);
    }

    for (const link of internalLinks.get(sourceFile) ?? []) {
      if (!exists(link)) errors.push(`${sourceFile}: broken internal link ${link}`);
    }

    if (frontmatter.canonical?.startsWith("/") && frontmatter.canonical !== page.path) {
      const target = byPath.get(frontmatter.canonical);
      if (!target) errors.push(`${sourceFile}: canonical ${frontmatter.canonical} doesn't exist`);
      else if (!target.indexable) errors.push(`${sourceFile}: canonical ${frontmatter.canonical} points to a noindex page`);
      else if (target.canonical !== target.path) errors.push(`${sourceFile}: canonical ${frontmatter.canonical} is itself canonicalized (chain)`);
    }
  }

  return errors;
}

export async function getAllPages(): Promise<Page[]> {
  return loadAllPages(contentVersion());
}

async function loadPageSummaries(version: string): Promise<PageSummary[]> {
  "use cache";
  cacheLife("max");
  return (await loadAllPages(version)).map(summarize);
}

/** Lightweight listing of every published page — for navigation, hubs, and sitemaps. */
export async function getPageSummaries(): Promise<PageSummary[]> {
  return loadPageSummaries(contentVersion());
}

async function loadPage(pagePath: string, version: string): Promise<Page | null> {
  "use cache";
  cacheLife("max");
  return (await loadAllPages(version)).find((page) => page.path === pagePath) ?? null;
}

export async function getPage(pagePath: string): Promise<Page | null> {
  return loadPage(pagePath, contentVersion());
}

/** Exact-match only: /Tool/X is a 404 rather than a duplicate of /tool/x. */
export function pathFromSegments(segments: string[]) {
  return `/${segments.join("/")}`;
}
