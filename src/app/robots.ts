import type { MetadataRoute } from "next";

import { isIndexingAllowed } from "@/lib/env/public";
import { absoluteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed) {
    // Previews and staging: keep everything out of search engines.
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
