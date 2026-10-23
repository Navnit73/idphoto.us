import { toString } from "hast-util-to-string";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { templates } from "@/components/templates";
import { getPage, getPageSummaries, pathFromSegments, type Page } from "@/lib/content/loader";
import { buildBreadcrumbs, categoryListing, DEFAULT_SCHEMA_TYPE } from "@/lib/content/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageJsonLd } from "@/lib/seo/json-ld";

/** Every content page is prerendered at build time; the build fails if one can't be. */
export const ensureStatic = "navigation";

/** A custom `ogImage`, or the generated card at /og/<path>. Shared by Open Graph tags and JSON-LD. */
function socialImage(page: Page) {
  return page.frontmatter.ogImage ?? `/og${page.path}`;
}

export async function generateStaticParams() {
  const pages = await getPageSummaries();
  return pages.map((page) => ({ path: page.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: PageProps<"/[...path]">): Promise<Metadata> {
  const page = await getPage(pathFromSegments((await params).path));
  if (!page) return {};
  const { frontmatter } = page;

  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    canonical: page.canonical,
    indexable: page.indexable,
    follow: frontmatter.robots.follow,
    noarchive: frontmatter.robots.noarchive,
    maxImagePreview: frontmatter.robots.maxImagePreview,
    keywords: frontmatter.keywords,
    ogImage: socialImage(page),
    type: page.template === "guide" ? "article" : "website",
    publishedTime: frontmatter.publishedAt,
    modifiedTime: page.updatedAt,
  });
}

export default async function ContentPage({ params }: PageProps<"/[...path]">) {
  const page = await getPage(pathFromSegments((await params).path));
  if (!page) notFound();

  const all = await getPageSummaries();
  const crumbs = buildBreadcrumbs(page, all);
  const Template = templates[page.template];

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          type: page.frontmatter.schemaType ?? DEFAULT_SCHEMA_TYPE[page.template],
          url: page.canonical,
          title: page.title,
          description: page.description,
          updatedAt: page.updatedAt,
          publishedAt: page.frontmatter.publishedAt,
          image: socialImage(page),
          author: page.author,
          reviewer: page.reviewer,
          breadcrumbs: crumbs,
          faq: page.faq.map((item) => ({ question: item.question, answer: toString(item.answer) })),
        })}
      />
      <Template page={page} crumbs={crumbs} categoryPages={categoryListing(page, all)} />
    </>
  );
}
