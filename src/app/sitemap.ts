import type { MetadataRoute } from "next";

import { getPageSummaries } from "@/lib/content/loader";
import { isIndexingAllowed } from "@/lib/env/public";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Lists only pages that should rank: published, indexable, and canonical to
 * themselves. Pages canonicalized elsewhere or marked noindex are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed) return [];
  const pages = await getPageSummaries();
  const newest = pages.reduce((latest, page) => (page.updatedAt > latest ? page.updatedAt : latest), "");

  return [
    { url: absoluteUrl("/"), lastModified: newest || undefined },
    ...pages.filter((page) => page.inSitemap).map((page) => ({ url: absoluteUrl(page.path), lastModified: page.updatedAt })),
  ];
}
