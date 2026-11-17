# Technical SEO Findings: https://idphoto.us (2026-11-17)

Score: 86/100. Crawled all 28 sitemap URLs (the full sitemap).

## Pass
- Crawlability: robots.txt allows all and disallows /api/. It declares the sitemap, and the helper validated it (200, valid urlset, 28 URLs). llms.txt returns 200.
- Indexability: all 28 pages return 200 with `index, follow`. Each has a self-referencing canonical that exactly matches its sitemap URL. Each has one H1, a title, a meta description, a viewport tag and OG tags. Each has 2 JSON-LD blocks. No images are missing alt text. The 404 page returns a real 404 with noindex.
- Security: HSTS (2 years, includeSubDomains, preload), a strict CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy and COOP are all present.
- Redirects: http to https takes 1 hop. A trailing slash gets a 308 to the non-slash URL. /index.html returns 404.
- Rendering: pages are prerendered (x-nextjs-prerender, Vercel HIT). The HTML is server-rendered and about 50-230 KB per page.
- URL structure: clean, lowercase and hierarchical (/tool, /guide, /checker).

## Issues
### Medium
1. www.idphoto.us has no DNS record, so the connection fails. Anyone who types or links the www version gets an error. Add a www CNAME in DNS and a Vercel redirect from www to the apex.
2. The sitemap has no `<lastmod>` on any URL. Add lastmod in src/app/sitemap.ts, using the content or git modified dates. It helps recrawl prioritization.
3. Several titles are long and likely to truncate. Examples: /tool/passport-photo-converter is about 75 characters, and /tool/us-visa-photo, /guide/driver-license-picture and /tool/print-passport-photos are 72-74. The limit is about 60. The title lengths I counted came from the raw HTML and may include HTML entities, which inflate the count. Shorten the titles, and consider dropping the " | idphoto.us" suffix on long ones.

### Low
4. Homepage HTML is about 190 KB, and tool pages run 160-230 KB. Much of this is likely inline RSC payload and JSON-LD. Check the LCP and INP impact of hydration on the tool pages, which run heavy client-side processing (WASM, background removal). The CSP allows `unsafe-inline` scripts. Moving to nonces or hashes would tighten it.
5. HTML responses have `cache-control: public, max-age=0, must-revalidate`. That is fine on Vercel because the CDN serves them, but the long-lived immutable static assets are already correct.
6. Some tool and guide pairs target the same topic: schengen-visa-photo-size and british-passport-photo exist as both /tool/ and /guide/ pages. Keep the intents distinct and cross-link them to avoid cannibalization.
7. There is no hreflang. That is acceptable for an English-only site, but several pages target UK, AU, NZ and IN audiences. Consider en-GB, en-AU and en-IN variants only if the content is localized.
8. The `access-control-allow-origin: *` header is set on HTML. It is harmless but unnecessary.

## Not verified
Real CWV field data (needs CrUX/PSI), mobile touch targets (source/CSS not inspected in depth), and IndexNow key file presence.
