import { rgb } from "pdf-lib";

/**
 * Literal color values for order emails, the printable invoice page and the
 * invoice PDF. Mail clients and pdf-lib can't read CSS variables, so these
 * mirror primitives in tokens.css — keep them in sync when the brand palette
 * changes. Allowed to hold raw colors by scripts/check-design-tokens.mjs.
 */
export const documentTheme = {
  background: "#ffffff", // --neutral-0
  surface: "#f5f5f7", // --neutral-100
  foreground: "#1d1d1f", // --neutral-900
  body: "#424245", // --neutral-700
  muted: "#6e6e73", // --neutral-600
  faint: "#86868b", // --neutral-500
  border: "#e8e8ed", // --neutral-200
  borderStrong: "#d2d2d7", // --neutral-300
  primary: "#0066cc", // --blue
  primaryForeground: "#ffffff", // --neutral-0
} as const;

/** The same palette as pdf-lib colors. */
export const pdfTheme = {
  foreground: rgb(0.114, 0.114, 0.122), // --neutral-900
  muted: rgb(0.431, 0.431, 0.451), // --neutral-600
  border: rgb(0.91, 0.91, 0.929), // --neutral-200
  primary: rgb(0, 0.4, 0.8), // --blue
  primarySubtle: rgb(0.902, 0.941, 0.98), // --primary-subtle
} as const;
