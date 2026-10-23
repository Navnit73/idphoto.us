import type { MetadataRoute } from "next";

import { getPageSummaries } from "@/lib/content/loader";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Lists only pages that should rank: published, indexable, and canonical to
 * themselves. Pages canonicalized elsewhere or marked noindex are left out.
 * URLs only, no <lastmod>: every page shares one date, which tells crawlers nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getPageSummaries();

  return [{ url: absoluteUrl("/") }, ...pages.filter((page) => page.inSitemap).map((page) => ({ url: absoluteUrl(page.path) }))];
}
