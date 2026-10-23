import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";
import { ogTheme } from "@/styles/og-theme";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Square raster version of src/app/icon.svg. Google needs a raster logo for
 * Organization markup, and iOS needs a PNG home-screen icon.
 */
export function renderLogo(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ogTheme.primary,
          color: ogTheme.primaryForeground,
          fontSize: size * 0.4,
          fontWeight: 700,
        }}
      >
        ID
      </div>
    ),
    { width: size, height: size },
  );
}

/** Shared 1200×630 social card used for every page without a custom `ogImage`. */
export function renderOgImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: ogTheme.background,
          borderTop: `16px solid ${ogTheme.primary}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 12,
              background: ogTheme.primary,
              color: ogTheme.primaryForeground,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ID
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: ogTheme.foreground }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 26, color: ogTheme.primary, textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 48 ? 60 : 72, fontWeight: 700, color: ogTheme.foreground, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 26, color: ogTheme.muted }}>Free tools · Plain-English guides · Official sources cited</div>
      </div>
    ),
    OG_SIZE,
  );
}
