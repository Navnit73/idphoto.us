# idphoto.us SEO Action Plan

Audit date: 2026-11-17. Overall SEO Health Score: **76/100**.

## Critical (fix now)
1. **Resolve the "free" vs paid contradiction.** Homepage, FAQ and About say everything is free, and tool schema declares `Offer price: 0` / `isAccessibleForFree: true`. But /refund-policy mentions bought photos and the repo has paid Standard/Expert plans (`src/lib/payments/pricing.ts`). Verify the live paid step, then fix copy and schema to show real pricing. Misleading claims hurt trust and violate structured-data rules.

## High (within 1 week)
2. Replace the "Reviewed by PixPassport.com Team" signal (the photo-processing vendor) with a named human author/reviewer, bio page and Person schema. Set Article `author` to that Person.
3. Resolve guide-vs-tool overlap (Schengen, British passport): give each a distinct intent and cross-link them.
4. Fix the DMV guide: it claims state coverage but cites only pa.gov. Add a state table with sources or narrow the claim. Remove "near me" filler.
5. Add real visuals: accepted vs rejected examples, head-height diagram, 4x6 layout. Guides currently have 0-1 images.

## Medium (within 1 month)
6. Add a `www` DNS record and a www to apex redirect in Vercel (www.idphoto.us currently fails).
7. Add `<lastmod>` to every URL in `src/app/sitemap.ts`.
8. Shorten ~10 titles over 60 chars (worst: passport-photo-converter, us-visa-photo, driver-license-picture, print-passport-photos). Fix awkward Schengen and New Zealand titles.
9. Expand the US requirements guide (about 1,000 words) past 2,000 with question headings, 40-60 word lead answers and a spec table. Expand the 391-word FAQ.
10. Add in-body internal links (US guide, passport photo editor and FAQ have none). Link guides to methodology and editorial policy.
11. Schema: move `reviewedBy`/`lastReviewed` onto the WebPage node, add Organization `sameAs`/`contactPoint`/ImageObject logo, fix the home FAQ `@id`, add CollectionPage/ItemList on hubs and ContactPage on /contact.
12. Preload the LCP image or set `fetchpriority="high"` on `/` and `/tool/*`.
13. Reduce homepage "passport photo" density (about 4.9%); use natural wording.

## Low (backlog)
- Code-split the editor, drop polyfills (browserslist), long immutable cache on hashed assets.
- Add `/llms-full.txt`, markdown delivery, IndexNow, security.txt.
- Expand thin /checker and /guide hubs.
- Re-run PageSpeed Insights with an API key for field Core Web Vitals.
- Remove `access-control-allow-origin: *` from HTML responses.
- Do not add more FAQPage schema (no rich results since May 2026).

## Ongoing
- Build YouTube, Reddit and LinkedIn presence and link them in `sameAs`. This is the biggest AI-visibility lever.
- Verify in Search Console; re-audit in 4-6 weeks (domain is about 4 weeks old).
