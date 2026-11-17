# Content Quality, E-E-A-T and On-Page SEO: idphoto.us

Audit date: 2026-11-17. Sample: 24 of the 28 sitemap URLs (everything except /data-security, /privacy-policy, /terms and /refund-policy, which were spot-checked only). Pages were fetched with `render_page.py --mode auto`. All pages are server-rendered (`is_spa: false`) and returned 200, with self-referencing canonicals and `index, follow`.

## Scores

| Metric | Score |
|---|---|
| **Content quality (overall)** | **64 / 100** |
| E-E-A-T composite | 47 / 100 |
| - Experience (20%) | 45 |
| - Expertise (25%) | 50 |
| - Authoritativeness (25%) | 35 |
| - Trustworthiness (30%) | 55 |
| AI citation readiness | 72 / 100 |
| Templated metadata risk | Low (0 of 24 templated, no shared CTA phrases) |

The E-E-A-T weights are this audit's own scoring model. Google does not publish numeric weights.

## Page inventory (sample)

| URL | Title len | Desc len | Words | Flesch | Published | H2/H3 | Contextual internal links out |
|---|---|---|---|---|---|---|---|
| / | 48 | 153 | 1283 | 60.7 | (none) | 12/37 | 12 |
| /about | 49 | 147 | 560 | 45.3 | mod 2026-10-23 | 11/3 | 0 |
| /faq | 58 | 152 | 391 | 61.9 | mod 2026-10-23 | 9/10 | 0 |
| /contact | 50 | 148 | 313 | 52.1 | - | 9/2 | 0 |
| /editorial-policy | 52 | 157 | 522 | 38.7 | - | 13/2 | 0 |
| /content-methodology | 58 | 147 | 512 | 46.1 | - | 10/2 | 0 |
| /guide | 56 | 159 | 233 | 50.2 | - | 7/4 | 3 |
| /guide/passport-photo-requirements | 55 | 158 | 964 | 54.4 | 2026-10-23 | 16/8 | **0** |
| /guide/british-passport-photo-rules | 64 | 157 | 1133 | 67.4 | 2026-11-09 | 18/15 | 3 |
| /guide/driver-license-picture | 68 | 150 | 2816 | 53.7 | 2026-11-07 | 20/36 | 1 |
| /guide/schengen-visa-photo-size | 67 | 149 | 2357 | 60.7 | 2026-10-30 | 15/29 | 3 (none to Schengen tool) |
| /tool | 56 | 150 | 425 | 65.1 | - | 7/10 | 9 |
| /tool/passport-photo-editor | 52 | 156 | 760 | 60.3 | 2026-10-23 | 13/7 | **0** |
| /tool/2x2-photo-maker | 65 | 145 | 1582 | 70.1 | 2026-10-24 | 14/15 | 1 |
| /tool/us-visa-photo | 70 | 149 | 1629 | 61.6 | 2026-10-24 | 14/14 | 3 |
| /tool/passport-photo-converter | 71 | 142 | 1520 | 61.9 | 2026-10-24 | 14/16 | 1 |
| /tool/print-passport-photos | 72 | 142 | 1639 | 69.9 | 2026-10-24 | 13/18 | 2 |
| /tool/india-passport-size-photo | 62 | 152 | 1774 | 63.0 | 2026-10-27 | 16/14 | 1 |
| /tool/new-zealand-passport-photo | 64 | 140 | 1775 | 60.7 | 2026-10-26 | 15/17 | 2 |
| /tool/australia-passport-photo | 65 | 146 | 1791 | 62.2 | 2026-11-02 | 17/18 | 1 |
| /tool/british-passport-photo | 68 | 145 | 1087 | 71.1 | 2026-11-09 | 14/10 | 2 |
| /tool/schengen-visa-photo-size | 53 | 154 | 2754 | 69.5 | 2026-10-30 | 17/28 | 3 (none to Schengen guide) |
| /checker | 48 | 147 | 183 | 57.2 | - | 7/1 | 1 |
| /checker/test-passport-photo | 61 | 160 | 1266 | 63.0 | 2026-10-28 | 16/14 | 1 |

"Contextual" counts only links in the page body. It leaves out the 15 sitewide nav and footer links that appear on every page.

## Findings by severity

### CRITICAL

**C1. "Free" claims contradict the paid checkout and the refund policy (Trust)**
- The homepage ("Free, no account, $0"), the FAQ ("Do your tools cost anything? No. All tools and guides are free"), and the About page ("we don't charge fees… if we add… an optional paid service, we'll say so clearly… first") all tell visitors the service is free.
- Every tool page has `WebApplication` / `Offer` schema with `price: 0` and `isAccessibleForFree: true`.
- But /refund-policy says: "If a photo you bought from idphoto.us is rejected… we refund 100% of what you paid." The codebase also has a live paid flow: `src/lib/payments/pricing.ts` defines "Standard" and "Expert edit" plans with per-currency prices, there is a checkout panel and a thank-you/payment-status page, and commit d7578d1 updated INR prices on 2026-11-10.
- Why it matters: if the download step asks for payment, the site advertises "free" and asks for money later. The QRG treats that as misleading (Lowest/Low Trust), and Google's structured-data policies forbid `price: 0` markup on a paid product. Photos for government documents sit next to YMYL (applications and fees), so the trust bar is high.
- Fix: decide what is actually free (for example a free preview or crop, with a paid full-resolution download). Then say that on the homepage, the FAQ, the About "How we're funded" section and each tool hero, and show the price before upload. Update the `Offer` schema to the real price and currency, or remove `offers`. If downloads really are free and paid editing is optional, state that clearly and list both tiers.

### HIGH

**H1. Guide and tool pages compete for the same keywords (Schengen, British)**
- `/guide/schengen-visa-photo-size` and `/tool/schengen-visa-photo-size` share the same slug and target the same query. Each runs 2,300-2,750 words, and their H2s overlap: size/dimensions, requirements, where to get one in the U.S., who needs one, FAQ. **Neither page links to the other.**
- `/guide/british-passport-photo-rules` and `/tool/british-passport-photo` both have "British vs. U.S. Passport Photo" and "Applying From the United States" sections. Here the tool does link to the guide.
- Fix: give each page a different job. The tool page should target "make / maker / online" intent and keep a short spec summary plus the tool. The guide should own "requirements / rules / size" in full depth. Link the two both ways with descriptive anchors, and cut repeated sections from the tool page (point to the guide instead).

**H2. Expertise and authority signals are weak for a YMYL-adjacent topic**
- All guides are bylined "idphoto.us Editorial Team" (author schema is the Organization). No named writer has credentials or a bio.
- Only 1 of the 4 guides (passport-photo-requirements) shows a "Reviewed by" credit, and the reviewer is "PixPassport.com Team", the site's own processing vendor. The conflict is disclosed, but it is not independent expertise.
- The site is about 4 weeks old (all `datePublished` values fall between 2026-10-23 and 2026-11-09). There is no external recognition, press coverage or third-party reviews.
- Fix: add a named author or reviewer with relevant experience (for example a professional photographer, a former acceptance-agent employee or a visa consultant), with a bio page and `Person` schema linked via `author` / `reviewedBy`. Add a "Reviewed by" credit to every guide. Earn citations from travel, expat and immigration resources.

**H3. Little first-hand experience evidence**
- The About page says "we test our tools on real photos and devices", but no page shows it. There are no example accepted or rejected photos, no before/after crops, no measured head-height overlays, and no rejection statistics or user outcomes.
- Image counts are low for a visual topic: guides have 0-1 images (`/guide/british-passport-photo-rules` has 0), and tool pages have 1.
- Fix: add annotated example photos (good vs. rejected), a crop template overlay, screenshots of the DS-160 or GOV.UK upload step, and real case notes ("we tested 40 phone selfies; the most common failure was…"). This is the cheapest way to raise the Experience score.

**H4. Driver license guide promises national coverage but is sourced from one state**
- Title, H1 and the "DMV Photo Rules by State" H2 promise all-state guidance. The three external sources are all pa.gov (Pennsylvania). The "by state" section has no state table, and it mentions Colorado without a source.
- It also has search-first headings and copy, for example the H2 "DMV Photo Center Near Me: Hours, Appointments and Wait Times" and the line "Searches like 'DMV photo center near me'… lead to the same place". The QRG flags this kind of query-driven filler as a low-effort or AI content marker.
- Fix: either add a sourced state-by-state table (glasses, smile, retake policy, linking each state DMV), or re-scope the page to general guidance with PA as a worked example. Remove the "near me" filler heading.

### MEDIUM

**M1. Thin internal linking in body copy**
- Flagship pages link out to related content almost only through nav and footer. `/guide/passport-photo-requirements` (the main U.S. guide), `/tool/passport-photo-editor` and `/faq` have **zero** in-body links to related tools or guides. Most tool pages have 1-2.
- `/tool/2x2-photo-maker` gets 11 contextual links in the sample, while `/guide/driver-license-picture`, `/guide/schengen-visa-photo-size` and the country tools get 2 each, all from hub pages. Country tools do not link to each other or to their own guides (apart from the British pair).
- Fix: in each guide, link the relevant tool at the matching step (for example size section to 2x2 maker, printing section to print tool, digital renewal to converter). Link each country tool to its guide. Link the FAQ answers to specific tools.

**M2. Titles too long (truncation risk)**
- 10 of 24 titles are over 60 characters because of the " | idphoto.us" suffix: print-passport-photos (72), passport-photo-converter (71), us-visa-photo (70), driver-license-picture (68), british-passport-photo (68), schengen guide (67), 2x2 (65), australia (65), british guide (64), NZ (64).
- Awkward or stuffed patterns: "Photo Size for Schengen Visa Photo Maker" (unnatural word order), and "New Zealand Passport Photo Online | NZ Photo Editor | idphoto.us" (double pipe, repeated synonym).
- Fix: keep the main keyword within the first 50-55 characters, and drop or shorten the brand suffix on long titles (for example "Schengen Visa Photo Maker: 35x45 mm Online").

**M3. Keyword-variant stuffing on the homepage and some headings**
- On the homepage, "passport photo" makes up about 4.9% of words (33 uses in about 1,340 words). It also cycles synonyms: "passport photo maker and photo ID editor", "This photo ID maker builds your passport ID picture", "U.S. passport picture".
- The Schengen tool H2s use unnatural forms like "Schengen Visa Size Photo at a Glance" and "Schengen Visa Size Photo vs. U.S. Passport Photo".
- Fix: rewrite in natural language and use one clear term per sentence.

**M4. FAQ page is thin**
- It has 391 words and 8 short answers, and cites one source. Several answers are one sentence with no link (background color, smiling).
- Fix: expand to 20-30 questions covering children and babies, digital renewal file specs, printing, rejection reasons, visa vs. passport, and non-U.S. specs. Link each answer to the guide or tool that covers it.

**M5. Core U.S. guide is shorter than its competitors**
- `/guide/passport-photo-requirements` is 964 words, against much longer Schengen (2,357) and DMV (2,816) guides. It is the most commercially important topic and is linked from the nav of every page.
- Fix: add sections on common rejection reasons with examples, a head-size measurement walkthrough with a diagram, digital-file specs for online renewal (pixel size, file size), and edge cases (infants, hijab or medical, twins, name change).

### LOW

**L1.** On /checker (183 words) and /guide (233 words), the hub pages are lists only. Add 150-300 words that orient the reader (which tool or guide fits which job) to support category-level queries.

**L2.** The homepage has no `datePublished`/`dateModified` and no outbound official links. The "How we work" section says pages are checked against official sources but links none. Link travel.state.gov on the homepage.

**L3.** A "Supported countries" spec list (for example "Brazil (3 × 4 foto) 354 × 472") repeats on about 10 tool pages. This is acceptable boilerplate, but consider collapsing it or moving it to one /countries page to cut repeated text.

**L4.** Metadata heuristic: `brand_suffix_in_description` fired on /contact, /content-methodology and /editorial-policy. In context the brand is used naturally in a sentence, so this is effectively a false positive. No action needed.

**L5.** No in-body links point to /about, /editorial-policy or /content-methodology from the guides. Add a short "How we check these rules" line under each guide byline that links to the methodology page.

## What is working (keep)

- **Metadata is clean**: every page has a unique title and description, descriptions are 140-160 characters, there is one H1 per page, and there is no templating (`templated_ratio` 0.0, `site_risk` low, no shared CTA phrases).
- **Good sources on guides**: they link primary sources (travel.state.gov, the 8 FAM, GOV.UK, EUR-Lex Regulation 810/2009, German, Czech, Dutch and Spanish consulates).
- **Strong trust pages**: About, Editorial policy, Content methodology, Contact, Privacy, Data security and Refund pages exist, and the About page discloses ownership (named owner) and the PixPassport relationship.
- **Clear disclaimers**: "not affiliated with the government" and "we can't guarantee acceptance" are stated plainly.
- **Readability fits a consumer audience**: Flesch Reading Ease is 54-71 on guides and tools. The policy pages score lower (39-46).
- **Freshness**: visible "Last updated" `<time>` elements match `dateModified` in schema.
- **Low body duplication**: the highest shingle containment between tool pages is 0.32 (converter vs. editor), and the rest sit under 0.30.

## AI citation readiness (72/100)

- Strengths: answer-first intros with exact specs ("35 × 45 mm, 32-36 mm face"); FAQPage schema on 15 pages; 1-3 spec tables on guides and tools; clear H2/H3 hierarchy; /llms.txt is present (200); robots allows all crawlers.
- Gaps: no named expert to attribute quotes to; no original data (rejection rates, test results) that an AI answer would need to cite idphoto.us rather than the government source; the homepage and FAQ are short on citable facts; the tool vs. guide overlap splits citation signals.

## Structured findings (audit-data.json, Content Quality)

```json
{
  "category": "Content Quality",
  "score": 64,
  "eeat": {"experience": 45, "expertise": 50, "authoritativeness": 35, "trustworthiness": 55, "composite": 47},
  "ai_citation_readiness": 72,
  "metadata_template": {"site_risk": "low", "templated_ratio": 0.0, "shared_cta_phrases": {}},
  "findings": [
    {"id": "C1", "severity": "critical", "title": "Free claims and price:0 Offer schema contradict paid checkout and refund policy", "urls": ["/", "/faq", "/about", "/refund-policy", "/tool/*"]},
    {"id": "H1", "severity": "high", "title": "Guide vs tool cannibalization (Schengen, British); Schengen pair not cross-linked", "urls": ["/guide/schengen-visa-photo-size", "/tool/schengen-visa-photo-size", "/guide/british-passport-photo-rules", "/tool/british-passport-photo"]},
    {"id": "H2", "severity": "high", "title": "No named authors/credentials; only 1/4 guides reviewed, by vendor; new domain with no external authority", "urls": ["/guide/*"]},
    {"id": "H3", "severity": "high", "title": "No first-hand experience evidence; 0-1 images on visual-topic pages", "urls": ["/guide/*", "/tool/*"]},
    {"id": "H4", "severity": "high", "title": "DMV guide claims national scope but cites only Pennsylvania; 'near me' search-first filler", "urls": ["/guide/driver-license-picture"]},
    {"id": "M1", "severity": "medium", "title": "Weak contextual internal linking; flagship guide, editor and FAQ have 0 in-body links", "urls": ["/guide/passport-photo-requirements", "/tool/passport-photo-editor", "/faq"]},
    {"id": "M2", "severity": "medium", "title": "10/24 titles exceed 60 chars; awkward Schengen tool and NZ titles", "urls": ["/tool/print-passport-photos", "/tool/passport-photo-converter", "/tool/us-visa-photo", "/tool/schengen-visa-photo-size", "/tool/new-zealand-passport-photo"]},
    {"id": "M3", "severity": "medium", "title": "Keyword-variant stuffing on homepage (~4.9% 'passport photo') and unnatural Schengen headings", "urls": ["/", "/tool/schengen-visa-photo-size"]},
    {"id": "M4", "severity": "medium", "title": "FAQ hub thin (391 words, 8 Qs, 1 source)", "urls": ["/faq"]},
    {"id": "M5", "severity": "medium", "title": "Core U.S. requirements guide only 964 words", "urls": ["/guide/passport-photo-requirements"]},
    {"id": "L1", "severity": "low", "title": "Hub pages /checker (183w) and /guide (233w) lack orienting copy", "urls": ["/checker", "/guide"]},
    {"id": "L2", "severity": "low", "title": "Homepage lacks dates and official outbound links", "urls": ["/"]},
    {"id": "L3", "severity": "low", "title": "Supported-countries spec list repeated on ~10 tool pages", "urls": ["/tool/*"]},
    {"id": "L4", "severity": "low", "title": "brand_suffix_in_description heuristic on 3 policy pages (false positive)", "urls": ["/contact", "/content-methodology", "/editorial-policy"]},
    {"id": "L5", "severity": "low", "title": "Guides do not link methodology/editorial pages in-body", "urls": ["/guide/*"]}
  ]
}
```
