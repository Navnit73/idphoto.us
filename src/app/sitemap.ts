import type { MetadataRoute } from "next";

import { getPageSummaries } from "@/lib/content/loader";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Lists only pages that should rank: published, indexable, and canonical to
 * themselves. Pages canonicalized elsewhere or marked noindex are left out.
 * <lastmod> is each page's own `updatedAt`; the home page uses the newest of them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getPageSummaries();

  const listed = pages.filter((page) => page.inSitemap);
  const newest = listed.reduce((latest, page) => (page.updatedAt > latest ? page.updatedAt : latest), "");

  return [
    { url: absoluteUrl("/"), lastModified: newest || undefined },
    ...listed.map((page) => ({ url: absoluteUrl(page.path), lastModified: page.updatedAt })),
  ];
}
