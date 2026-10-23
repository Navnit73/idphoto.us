import { siteConfig } from "@/config/site";
import { renderOgImage } from "@/lib/seo/og-image";

/** Default social card (home page and code-defined routes). */
export function GET() {
  return renderOgImage({ eyebrow: siteConfig.name, title: siteConfig.tagline });
}
