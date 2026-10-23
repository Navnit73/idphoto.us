/**
 * Literal color values for generated Open Graph images. Satori (next/og) can't
 * read CSS variables, so these mirror primitives in tokens.css — keep them in
 * sync when the brand palette changes. This is the only TS file allowed to
 * hold raw colors (see scripts/check-design-tokens.mjs).
 */
export const ogTheme = {
  background: "#ffffff", // --neutral-0
  surface: "#f5f5f7", // --neutral-100
  foreground: "#1d1d1f", // --neutral-900
  muted: "#6e6e73", // --neutral-600
  primary: "#0066cc", // --blue
  primaryForeground: "#ffffff", // --neutral-0
} as const;
