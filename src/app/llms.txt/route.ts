import { siteConfig } from "@/config/site";
import { getPageSummaries } from "@/lib/content/loader";
import { absoluteUrl } from "@/lib/seo/metadata";

const SECTIONS = [
  { category: "tool", heading: "Tools" },
  { category: "checker", heading: "Checkers" },
  { category: "guide", heading: "Guides" },
  { category: "about", heading: "About" },
  { category: "legal", heading: "Policies" },
] as const;

/** /llms.txt (https://llmstxt.org): a Markdown index of the pages listed in the sitemap. Prerendered at build time. */
export async function GET() {
  const pages = (await getPageSummaries()).filter((page) => page.inSitemap);

  const sections = SECTIONS.map(({ category, heading }) => {
    const links = pages
      .filter((page) => page.category === category)
      .map((page) => `- [${page.heading}](${absoluteUrl(page.path)}): ${page.description}`);
    return links.length ? `## ${heading}\n\n${links.join("\n")}` : "";
  }).filter(Boolean);

  const body = [`# ${siteConfig.name}`, `> ${siteConfig.description}`, ...sections].join("\n\n");
  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
