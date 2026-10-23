<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Styling rules

- All visual values come from design tokens in `src/styles/tokens.css`, exposed to Tailwind in `src/app/globals.css` (`@theme inline`). See README → Design system.
- Never hardcode colors (hex, `rgb()`, `oklch()`, Tailwind palette classes like `bg-blue-500`). Use semantic utilities (`bg-surface`, `text-muted-foreground`, `border-border`). New color roles go in `tokens.css` first, then get mapped in `globals.css`.
- Prefer semantic tokens (which already adapt to light/dark) over `dark:` overrides.
- `npm run lint` runs ESLint plus `scripts/check-design-tokens.mjs`.

## Content and SEO rules

- Pages live in `content/` as Markdown with Zod-validated frontmatter (`src/lib/content/schema.ts`). Read `docs/CONTENT.md` before adding or editing pages.
- Templates render the only H1; Markdown bodies start at `##`. `npm run build` fails on content errors — fix the content, don't loosen the validator.
- Never fabricate credentials, reviewers, official affiliations, statistics, or guarantees. Official requirements must cite primary sources in `sources`.
- Metadata goes through `buildMetadata()` (`src/lib/seo/metadata.ts`); structured data through `src/lib/seo/json-ld.ts`.
- Browser code calls our API with `apiPost` (`src/lib/http/client.ts`); server code calls third parties with `serverHttp` (`src/lib/http/server.ts`). Never import server modules (`env/server`, `db`, `logger`) into client components.
