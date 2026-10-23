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
