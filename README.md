# idphoto.us

SEO-focused passport and ID photo tools and guides. Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, and MongoDB.

- **Markdown-driven pages.** Every page except the home page is a Markdown file in `content/`. Frontmatter controls the route, template, metadata, structured data, and SEO settings. See [docs/CONTENT.md](docs/CONTENT.md).
- **Static by default.** Content pages are prerendered at build time (`ensureStatic = "navigation"`). Only `/api/*` runs per request.
- **Photo tools.** The passport photo editor (on the home page and `/tool/passport-photo-editor`) uploads photos to the PixPassport API for cropping and background checks.
- **Validated content.** The build fails on duplicate titles, thin pages, broken internal links, bad canonicals, or a wrong heading structure.

## Getting started

```bash
cp .env.example .env.local   # all values are optional in development
npm install
npm run dev                  # http://localhost:3000
```

| Script                | What it does                                                   |
| --------------------- | -------------------------------------------------------------- |
| `npm run dev`         | Development server (Turbopack)                                 |
| `npm run build`       | Production build; also validates all Markdown content          |
| `npm run start`       | Serve the production build                                     |
| `npm run lint`        | ESLint + design-token check                                    |
| `npm run lint:tokens` | Fail on hardcoded colors outside the token file                |
| `npm run typecheck`   | TypeScript, no emit                                            |
| `npm run test:a11y`   | Builds, then runs axe (WCAG 2.2 AA) and keyboard checks in Playwright; see `ACCESSIBILITY.md` |

Deployment, environment variables, security, and the launch checklist are covered in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project structure

```
content/                    Markdown pages: tools/ guides/ about/ legal/ + authors.json
docs/                       CONTENT.md (authoring), DEPLOYMENT.md
public/images/              Images referenced from Markdown
scripts/                    check-design-tokens.mjs
src/
  app/
    (content)/[...path]/    Catch-all: resolves a URL to a Markdown page and its template
    api/contact|feedback|health/   Route handlers (validated, rate-limited)
    og/                     Generated 1200×630 social images (static)
    sitemap.ts, robots.ts   Built from content; noindex outside production
    layout.tsx, page.tsx    Root layout, home page
  components/
    content/                Markdown renderer, page header, TOC, FAQ, sources, breadcrumbs
    templates/              tool, guide, faq, legal, info, hub (+ registry)
    tools/                  Photo editor (PixPassport upload)
    widgets/                Lazy widget registry, contact form, feedback
    ui/, layout/, theme/    Primitives, header/footer, theme toggle
  config/site.ts            Site name, nav, footer links
  lib/
    content/                Frontmatter schema (Zod), loader + validation, Markdown pipeline
    seo/                    buildMetadata, JSON-LD builders, OG renderer
    db/                     MongoDB client (pooled, cached) and typed collections
    http/                   Axios: client.ts (browser → /api), server.ts (server → third parties)
    api/                    Route-handler wrapper (origin, size, validation, errors), rate limiter
    env/                    Zod-validated public and server environment
    logger.ts               Structured JSON logger with redaction
  proxy.ts                  Lowercase-URL redirects
  instrumentation.ts        Logs unhandled server errors
  styles/                   tokens.css (design tokens), og-theme.ts
```

## How a request becomes a page

1. `generateStaticParams` lists every published page from `content/`, and each one is prerendered.
2. `getPage(path)` returns the validated frontmatter and the parsed Markdown tree (cached with `"use cache"`).
3. `generateMetadata` → `buildMetadata()` sets the title, description, canonical, robots, Open Graph, and Twitter tags.
4. The page renders JSON-LD (breadcrumbs plus `Article`, `WebApplication`, `FAQPage`, etc.), then hands off to the template named by `template`.
5. A tool template embeds its `widget`, which is code-split and loaded only on that page.

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
| Spacing         | Numeric scale (`p-4` = 4 × `--space-unit`), `px-gutter`, `py-section`, `pt-page`, `h-header` |
| Layout width    | `max-w-content`, `max-w-prose`                                                  |
| Radius / shadow | `rounded-sm…xl`, `shadow-sm…lg`                                                 |
| Motion          | `transition-*` defaults to `--duration-base` and `--easing-standard`; `ease-emphasized` |
| Raw CSS         | `var(--color-primary)`, `var(--space-gutter)`, …                                |

Form controls (inputs, selects, the country picker) use `border-input`, which meets 3:1 against every surface. `border-border` and `border-border-strong` are for decorative edges only.

Tailwind's default color palette and shadows are switched off, so classes like `bg-blue-500` don't generate. `npm run lint` also fails on hex, `rgb()`, `oklch()` and similar values anywhere outside `tokens.css`.

**Adding a color role**: add a semantic token in `tokens.css` (`--info: light-dark(…, …)`), then map it in `globals.css` (`--color-info: var(--info);`). `bg-info` and `text-info` are then available.

**Themes**: with no `data-theme` on `<html>` the site follows the OS preference. `data-theme="light"` or `"dark"` forces a theme. The toggle saves the choice to `localStorage`, and an inline script in `<head>` applies it before first paint, so there's no flash. Use the `dark:` variant only when a token can't express the difference.
