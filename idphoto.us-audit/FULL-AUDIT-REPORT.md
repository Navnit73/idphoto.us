# idphoto.us Full SEO Audit Report

Date: 2026-11-17. Business type: tool-led informational site (free/paid passport and visa photo tools plus guides).

## Overall SEO Health Score: 76/100

| Category | Weight | Score | Source |
|---|---|---|---|
| Technical SEO | 22% | 86 | findings/technical.md |
| Content Quality | 23% | 64 | findings/content.md |
| On-Page SEO | 20% | 78 | metadata clean; long titles, thin in-body links, keyword density (estimate from content findings) |
| Schema | 10% | 78 | findings/schema.md |
| Performance | 10% | 92 | findings/performance.md (lab only, no field data; lab avg 98.7) |
| AI Search Readiness | 10% | 63 | findings/geo.md |
| Images | 5% | 60 | no missing alt text, but very few images (estimate) |

On-Page, Performance and Images scores are my own estimates from the agents' evidence, not scored directly by an agent.

## Top 5 issues
1. Free vs paid claims contradict each other (copy and schema).
2. No named human expertise; reviewer is the photo-API vendor.
3. Guide and tool pages overlap on the same queries (Schengen, British).
4. Almost no images or first-hand evidence on a visual topic.
5. Weak off-site brand signals (no sameAs, no YouTube/Reddit/LinkedIn).

## Top 5 quick wins
1. Add `<lastmod>` to the sitemap.
2. Add www DNS record and redirect.
3. Shorten 10 over-long titles.
4. Preload/`fetchpriority="high"` the LCP image.
5. Fix schema nesting (`reviewedBy`) and add Organization `sameAs`.

## What works
Valid sitemap (28 URLs), canonicals, one H1 per page, unique 140-160 char descriptions, strict security headers, server-rendered HTML, clean URLs, valid JSON-LD on every page, lab Lighthouse 98-100, AI crawlers allowed, llms.txt present, primary-source citations, trust pages with vendor disclosure.

## Coverage and limits
- Technical: all 28 URLs. Content: 24 of 28. Schema: 5 of 26 URLs sampled. Performance: 3 pages, one lab run each.
- No CrUX/PSI field data (PSI rate-limited), no GSC/GA4, no backlink data, no visual/mobile screenshots, no sitemap-specialist or SXO pass.
- Reddit check was blocked and is unconfirmed.

See ACTION-PLAN.md and findings/ for detail.
