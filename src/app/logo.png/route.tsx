import { renderLogo } from "@/lib/seo/og-image";

/** 512×512 PNG logo at a stable URL, referenced by the Organization structured data. */
export function GET() {
  return renderLogo(512);
}
