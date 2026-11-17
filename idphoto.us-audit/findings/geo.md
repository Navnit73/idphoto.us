# GEO / AI Search Readiness: idphoto.us

Audit date: 2026-11-17. Pages sampled: `/`, `/guide/passport-photo-requirements`, `/faq`, `/tool/schengen-visa-photo-size`, plus robots.txt, llms.txt, sitemap.xml, and /.well-known probes.

## GEO Readiness Score: 63 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 68 | 17.0 |
| Structural Readability | 20% | 75 | 15.0 |
| Multi-Modal Content | 15% | 40 | 6.0 |
| Authority & Brand Signals | 20% | 42 | 8.4 |
| Technical Accessibility | 20% | 85 | 17.0 |
| **Total** | | | **63.4** |

The technical foundation is strong: SSR/prerendered HTML, open crawler access, and a clean llms.txt. Off-site entity presence and named human authority are weak, and pages have almost no visual or media assets.

## 1. AI Crawler Access (robots.txt)

```
User-Agent: *
Allow: /
Disallow: /api/
Sitemap: https://idphoto.us/sitemap.xml
```

No bot-specific rules exist, so every crawler falls under the wildcard. Live UA tests on `/guide/passport-photo-requirements` returned HTTP 200 for every bot. No WAF or bot blocking was seen at the Vercel edge.

| Crawler | What it governs | Status |
|---|---|---|
| OAI-SearchBot | ChatGPT Search citations | Allowed (200) |
| Claude-SearchBot | Claude search citations | Allowed (200) |
| PerplexityBot | Perplexity search index | Allowed (200) |
| Googlebot | Google Search and AI Overviews / AI Mode inclusion | Allowed (200) |
| Bingbot | Bing and Copilot grounding | Allowed (200) |
| GPTBot | OpenAI model training only (not ChatGPT Search) | Allowed (wildcard) |
| ClaudeBot | Anthropic model training only (not Claude search) | Allowed (wildcard) |
| Google-Extended | Gemini/Vertex training and grounding, plus training of the models behind Search gen-AI features. Does not affect Search or AIO inclusion | Allowed (wildcard) |
| Applebot-Extended | Apple Intelligence training only. Does not affect Siri/Spotlight | Allowed (wildcard) |
| CCBot | Common Crawl (training corpora) | Allowed (200) |
| cohere-ai | Cohere training | Allowed (wildcard) |

Verdict: all search/citation crawlers have access. Training crawlers are also allowed, which is a business decision. For a new brand it helps with entity recall in model weights. `/api/` is correctly disallowed.

## 2. llms.txt and Licensing

- `/llms.txt`: **present and well-formed** (served by `src/app/llms.txt/route.ts`). It has an H1, a blockquote summary, and Tools / Checkers / Guides / About / Policies sections. Every link has a descriptive one-line summary, and those summaries already contain citable facts such as "35 × 45 mm, 29–34 mm head, 600 × 750 px".
- `/llms-full.txt`: missing (404).
- `/.well-known/llms.txt`: 404. This is optional and the root location is the standard.
- RSL 1.0: no `/license.xml` and no `License:` directive in robots.txt. Not present.

## 3. Agent-Readiness

| Check | Result |
|---|---|
| Markdown via `Accept: text/markdown` | No. Returns text/html |
| `.md` URL variant (e.g. `/guide/x.md`) | 404 |
| `Link: rel="alternate" type="text/markdown"` header | None (only a font preload Link header) |
| `/.well-known/ai-plugin.json`, `agent.json`, `mcp.json` | 404 |
| `/.well-known/security.txt` | 404 |
| Public JSON API for specs | `/api/photo/requirements` exists but is robots-disallowed and undocumented for agents |
| Rendering | Next.js prerender (`X-Nextjs-Prerender: 1`), `is_spa=false`. Full text is in the raw HTML |

## 4. Citability (passage-level, trafilatura extracted_text)

Strengths:
- Answer-first leads. The guide says: "If you only remember three things: the photo must be 2 × 2 inches, your head must be 1 to 1⅜ inches... background must be plain white or off-white." This is a highly extractable passage.
- Spec summary chips appear near the top (2 × 2 in, 1–1⅜ in head, white background).
- The Schengen tool page is very fact-dense (about 74 numeric spec mentions, 3 tables, 13 question headings), with primary sources (eur-lex.europa.eu, mzv.gov.cz, diplo.de).
- The guide cites travel.state.gov and fam.state.gov in a Sources section.
- Every page has an FAQ block with FAQPage schema and question H3s.

Weaknesses:
- Passages are short. Body paragraphs run 40–72 words, and none fall in the 130–170 word self-contained range. That range is a third-party heuristic only; Google says content need not be chunked for AI. Short paragraphs extract well for fact queries, but they lose context for "explain/why" queries. The glasses rule, for example, is 3 sentences with no "since 2016" context.
- Guide H2s are topical rather than questions ("Size and framing", "Your appearance"). Only 3 of the 25 headings on the main guide are questions, against 13 of 46 on the Schengen page.
- The homepage has no extractable answer passage over 40 words. It is mostly marketing and link lists, and has no outbound source links.
- The main guide is only about 1,000 words, thinner than the Schengen tool page (about 3,000). The pillar topic (U.S. requirements) has less depth than a secondary topic.
- Statistics are spec values, not data. There are no original data points such as rejection-rate figures with attribution.

## 5. Authority and Brand Signals

On-site:
- Present: "Last updated" with `<time>`, Article `datePublished`/`dateModified`, editorial policy, content methodology, about, contact, data security, and refund policy pages. These are good trust scaffolding.
- Byline is "idphoto.us Editorial Team". Article `author` points to the Organization, not a Person. A founder Person (Navnit Rai) appears in Organization schema only.
- "Reviewed by: PixPassport.com Team", with an outbound link to pixpassport.com. PixPassport is the photo-processing API vendor (`src/lib/photo/pixpassport.ts`). A vendor named as content reviewer is a weak and possibly confusing E-E-A-T signal. AI systems may read it as the content's authority, or as a commercial affiliation.
- Organization schema has no `sameAs`, so it is not linked to any external profile.
- All dates are in late Oct to Nov 2026. The domain and content are very new, and the homepage `publication_date` reads 2026-01-01.

Off-site entity presence:

| Platform | Finding |
|---|---|
| Wikipedia | No mention (API search: 0 hits) |
| Wikidata | No entity |
| Reddit | Not verifiable (search API blocked); no presence assumed |
| YouTube | No channel or verifiable mentions found (strongest citation correlate, about 0.737) |
| LinkedIn | No sameAs or link from site; no company page referenced |
| Web mentions | None found outside the domain |

The brand-signal gap is the main limit on AI citation for a new domain in a competitive YMYL-adjacent niche (passport and government documents).

## 6. Multi-Modal Content

- About 1 `<img>` per page (hero/editor). Alt text is present on all images.
- Dynamic OG images exist (`/og/...`).
- Tables: 1 on the guide, 3 on Schengen, none on the homepage or FAQ.
- No video, no annotated example photos (correct vs rejected), no head-height diagram, no ImageObject/VideoObject schema.
- This is a visual topic where AIO and Perplexity often show images, so the lack of diagrams is a missed opportunity.

## 7. Platform-Specific Scores

| Platform | Score | Notes |
|---|---|---|
| Google AI Overviews / AI Mode | 58 | Follows Googlebot and organic rank. Good schema and specs, but the domain is new and the guide is thin against gov and incumbent pages |
| ChatGPT Search | 55 | OAI-SearchBot allowed. Relies heavily on Bing index plus brand mentions, which are near zero |
| Perplexity | 64 | PerplexityBot allowed. Rewards fact-dense, source-cited pages like the Schengen page |
| Bing Copilot | 57 | Bingbot allowed; IndexNow not detected. Brand and entity signals are weak |
| Claude search | 60 | Claude-SearchBot allowed; clean SSR HTML |

## 8. Top 5 Highest-Impact Changes

1. **Build off-site entity presence (YouTube, Reddit, LinkedIn) and add `sameAs`.** Effort: high and ongoing. Make short YouTube how-tos ("measure head height on a 2x2 photo", "fix a rejected passport photo"). Answer questions on Reddit in r/passports and r/travel, with disclosure. Create LinkedIn and Crunchbase pages, then list them in Organization `sameAs`. Impact: highest, since brand mentions correlate most strongly with AI citations.
2. **Replace the "PixPassport.com Team" reviewer with a named human reviewer and Person author schema.** Effort: low (2–4 h). Name a person with relevant experience, give them a bio page, and use `author: Person` with `sameAs`. Keep the vendor disclosure on the methodology page instead.
3. **Expand the U.S. requirements guide into the pillar (2,000+ words) with question H2s and self-contained answer blocks.** Effort: medium (1–2 days). Use H2s like "What size is a US passport photo?", "Can you wear glasses in a passport photo?" and "What background color...?". Open each with a 40–60 word direct answer, then 100–150 words of context (2016 glasses rule, digital 600×600–1200×1200 px spec, infants). Add a spec table that mirrors the Schengen page.
4. **Add annotated visuals: a head-height diagram, accepted vs rejected examples, and a 4x6 print layout.** Effort: medium (1 day). Use descriptive filenames and alt text, plus ImageObject schema. Add one short embedded YouTube video to the main guide.
5. **Agent-readiness layer: markdown delivery, llms-full.txt, and IndexNow.** Effort: low to medium (4–8 h). Serve `text/markdown` on `Accept` negotiation or `.md` routes for guide and tool pages, and advertise them with `Link: rel="alternate"`. Generate `/llms-full.txt` from `content/`. Add an IndexNow key and ping on publish, which feeds Bing/Copilot and ChatGPT Search. Optionally add `/.well-known/security.txt`, and an RSL `license.xml` if licensing terms matter.

Smaller items: convert homepage marketing blocks into one 50-word "what is idphoto.us" answer passage; add outbound source links on the homepage; add `<lastmod>` to the sitemap (currently none); make sure the homepage `publication_date` (2026-01-01) is accurate.

## 9. Structured findings (audit-data.json, category: AI Search Readiness)

```json
{
  "category": "AI Search Readiness",
  "score": 63,
  "dimensions": {"citability": 68, "structural_readability": 75, "multimodal": 40, "authority_brand": 42, "technical_accessibility": 85},
  "platform_scores": {"google_aio": 58, "chatgpt_search": 55, "perplexity": 64, "bing_copilot": 57, "claude_search": 60},
  "findings": [
    {"id": "geo-robots", "severity": "pass", "title": "All AI search and training crawlers allowed", "detail": "Wildcard Allow: /, Disallow: /api/. OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot all return 200."},
    {"id": "geo-llmstxt", "severity": "pass", "title": "llms.txt present and well-formed", "detail": "H1, summary, 5 sections, descriptive links. llms-full.txt missing."},
    {"id": "geo-ssr", "severity": "pass", "title": "Content server-rendered", "detail": "Next.js prerender; full text in raw HTML; is_spa=false."},
    {"id": "geo-brand", "severity": "high", "title": "No off-site entity presence", "detail": "No Wikipedia/Wikidata, YouTube, Reddit, or LinkedIn presence detected; Organization schema lacks sameAs."},
    {"id": "geo-reviewer", "severity": "high", "title": "Content reviewer is API vendor brand, no named human author", "detail": "Byline 'idphoto.us Editorial Team', reviewer 'PixPassport.com Team'; Article author is Organization."},
    {"id": "geo-pillar-thin", "severity": "medium", "title": "Main US guide thin with topical (non-question) headings", "detail": "~1,000 words, 3/25 question headings; paragraphs 40-72 words."},
    {"id": "geo-multimodal", "severity": "medium", "title": "Minimal visual/video content", "detail": "~1 image per page, no diagrams, no video, no ImageObject/VideoObject schema."},
    {"id": "geo-markdown", "severity": "low", "title": "No markdown delivery for agents", "detail": "Accept: text/markdown returns HTML; .md routes 404; no rel=alternate markdown Link header."},
    {"id": "geo-wellknown", "severity": "low", "title": "No /.well-known agent or security files", "detail": "ai-plugin.json, agent.json, mcp.json, security.txt, llms.txt all 404."},
    {"id": "geo-rsl", "severity": "info", "title": "No RSL 1.0 license", "detail": "No /license.xml or robots License directive."},
    {"id": "geo-sitemap-lastmod", "severity": "low", "title": "Sitemap lacks lastmod", "detail": "28 URLs, 0 lastmod entries."}
  ]
}
```
