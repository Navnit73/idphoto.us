/**
 * Literal color values for generated Open Graph images. Satori (next/og) can't
 * read CSS variables, so these mirror primitives in tokens.css — keep them in
 * sync when the brand palette changes. This is the only TS file allowed to
 * hold raw colors (see scripts/check-design-tokens.mjs).
 */
export const ogTheme = {
  background: "#ffffff", // --neutral-0
  surface: "#f8f9fb", // --neutral-50
  foreground: "#141922", // --neutral-900
  muted: "#5b6170", // --neutral-600
  primary: "#2050e0", // --brand-600
  primaryForeground: "#ffffff", // --neutral-0
} as const;
