# Performance Findings - idphoto.us (2026-11-17)

Method: PSI API (keyless) returned "rate limit exceeded" for all 3 URLs, so no CrUX field data was obtained. Fallback: local Lighthouse 13.6.0 CLI, headless Chrome, default mobile emulation, performance category, single run per page (lab data, not field).

| Page | Score | FCP | LCP | TBT | CLS | TTFB (root doc) | Weight |
|---|---|---|---|---|---|---|---|
| / | 98 | 1.2s | 2.0s | 110ms | 0 | 40ms | 346 KiB |
| /tool/2x2-photo-maker | 98 | 1.0s | 2.1s | 80ms | 0.015 | 40ms | 339 KiB |
| /guide/passport-photo-requirements | 100 | 1.0s | 1.0s | 90ms | 0 | 40ms | 347 KiB |

CWV lab status: LCP pass (<=2.5s), CLS pass (<=0.1), INP not measurable in lab (TBT 80-110ms is a low-risk proxy). Field verdict: unknown.

## Bottlenecks
- Unused JavaScript: ~50 KiB savings on every page (shared bundle).
- Legacy JavaScript: ~14 KiB (unneeded transpilation/polyfills).
- Cache insight: ~10 KiB savings (cache lifetimes on some static assets).
- Render-blocking resources and network dependency chain flagged on all pages.
- LCP discovery insight flagged on / and the tool page (LCP image/element not discovered early; likely missing preload or fetchpriority=high).
- Tool page CLS 0.015 (minor, within good).

## Recommendations (by impact)
1. Add fetchpriority="high" / preload for the LCP image on / and /tool/* (LCP 2.0-2.1s to ~1.5s).
2. Code-split the shared JS bundle and lazy-load the photo-editor code only on tool pages (-50 KiB, lower TBT/INP risk).
3. Inline critical CSS or defer non-critical CSS to cut render-blocking.
4. Raise browsers target to drop legacy polyfills (-14 KiB).
5. Set long immutable Cache-Control on hashed static assets.
6. Reserve dimensions for the element causing the 0.015 shift on tool pages.
7. Re-run PSI with an API key to get CrUX field data (p75 LCP/INP/CLS) to confirm.

## Limits
Single lab run, one device profile, no desktop run, no field data, no INP. TTFB 40ms is excellent.

Performance score (avg of 3): 98.7/100
