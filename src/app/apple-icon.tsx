import { renderLogo } from "@/lib/seo/og-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon. iOS ignores SVG icons, so this renders src/app/icon.svg's design as a PNG. */
export default function AppleIcon() {
  return renderLogo(size.width);
}
