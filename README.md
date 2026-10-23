# idphoto.us

Passport and ID photo service. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script               | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Development server (Turbopack)                    |
| `npm run build`      | Production build                                  |
| `npm run start`      | Serve the production build                        |
| `npm run lint`       | ESLint + design-token check                       |
| `npm run lint:tokens`| Fail on hardcoded colors outside the token file   |
| `npm run typecheck`  | TypeScript, no emit                               |

## Project structure

```
src/
  app/                 Routes, root layout, globals.css (Tailwind ↔ token mapping)
  styles/tokens.css    Design tokens — every color, font, size, radius, shadow, easing
  components/ui/       Primitives (Button, Container)
  components/layout/   Site header and footer
  components/theme/    Theme toggle (system / light / dark)
  config/site.ts       Site name, URL, description, navigation
  lib/                 Helpers (cn, theme)
scripts/               Repo tooling (design-token check)
```

## Design system

All visual values live in [`src/styles/tokens.css`](src/styles/tokens.css). Change a token there and the whole site updates.

**Layers**

1. **Primitives**: raw palette (`--brand-600`, `--neutral-200`…) and scales. Only the semantic layer references them.
2. **Semantic tokens**: roles such as `--background`, `--primary`, `--border`, `--muted-foreground`. Each color is defined once with `light-dark()` and adapts to the active theme.
3. **Tailwind mapping**: [`src/app/globals.css`](src/app/globals.css) exposes semantic tokens as utilities through `@theme inline`.

**Using tokens in components**

| Need            | Use                                                                             |
| --------------- | ------------------------------------------------------------------------------- |
| Color           | `bg-surface`, `text-muted-foreground`, `border-border-strong`, `bg-primary/10`  |
| Font            | `font-sans`, `font-display`, `font-mono`                                        |
| Type scale      | `text-xs` … `text-5xl` (sizes and line heights come from tokens)                |
| Spacing         | Numeric scale (`p-4` = 4 × `--space-unit`), `px-gutter`, `py-section`, `h-header` |
| Layout width    | `max-w-content`, `max-w-prose`                                                  |
| Radius / shadow | `rounded-sm…xl`, `shadow-sm…lg`                                                 |
| Motion          | `transition-*` defaults to `--duration-base` and `--easing-standard`; `ease-emphasized` |
| Raw CSS         | `var(--color-primary)`, `var(--space-gutter)`, …                                |

Tailwind's default color palette and shadows are switched off, so classes like `bg-blue-500` don't generate. `npm run lint` also fails on hex, `rgb()`, `oklch()` and similar values anywhere outside `tokens.css`.

**Adding a color role**: add a semantic token in `tokens.css` (`--info: light-dark(…, …)`), then map it in `globals.css` (`--color-info: var(--info);`). `bg-info` and `text-info` are then available.

**Themes**: with no `data-theme` on `<html>` the site follows the OS preference. `data-theme="light"` or `"dark"` forces a theme. The toggle saves the choice to `localStorage`, and an inline script in `<head>` applies it before first paint, so there's no flash. Use the `dark:` variant only when a token can't express the difference.
