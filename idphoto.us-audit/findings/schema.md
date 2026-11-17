# Schema audit: idphoto.us (2026-11-17)
Pages checked (raw HTML, server-rendered): /, /about, /tool/us-visa-photo, /guide/passport-photo-requirements, /faq. Sitemap has 26 URLs.
Score: 78/100

## Detected
- All pages: one valid JSON-LD @graph, https://schema.org context, absolute URLs, ISO dates, stable @id references. No Microdata/RDFa.
- Home: Organization, WebSite, WebPage, FAQPage
- About: Organization, WebSite, BreadcrumbList, AboutPage
- Tool: + BreadcrumbList, WebApplication (free Offer), FAQPage
- Guide: + BreadcrumbList, Article, FAQPage
- FAQ: + BreadcrumbList, FAQPage (as page type)

## Issues
1. (Info) FAQPage on home, tool, guide, /faq. FAQ rich results retired May 2026: no Google SERP benefit; AI/GEO benefit unconfirmed. Harmless; keep or remove, do not expand.
2. (Medium) Article author is the Organization. Use a Person (named, with url/profile page) for E-E-A-T; the site has editorial-policy and about pages to link to.
3. (Medium) Article mainEntityOfPage.reviewedBy is "PixPassport.com Team", a different domain. Confirm that it is accurate; it is a confusing entity signal. Also reviewedBy/lastReviewed belong on the WebPage node, not nested in mainEntityOfPage.
4. (Low) Organization lacks sameAs (social/profiles) and contactPoint; logo is a bare URL (use ImageObject with width/height; logo should be at least 112x112 px).
5. (Low) Home FAQPage @id "https://idphoto.us#faq" lacks the slash, inconsistent with the other @ids.
6. (Low) Home WebPage has no datePublished/dateModified or image. Article is missing a relevant dateModified on the Article node itself (it sits in the merged page node, which is fine).
7. (Low) WebApplication on tool pages: no aggregateRating (add only if real, visible reviews exist). Consider SoftwareApplication-compatible fields like featureList, screenshot.
8. (Low) Node merging: WebPage props and the Article/WebApplication/AboutPage type are combined in one node with @type last. This is valid but unusual; consider "@type": ["WebPage","Article"] if intended.

## Missing opportunities
- Hub pages /tool, /guide, /checker: CollectionPage + ItemList + BreadcrumbList (not checked, assumed missing; verify).
- Policy/contact pages: ContactPage on /contact; WebPage on policies with breadcrumbs.
- Other guides/tools: confirm they use the same templates (only one of each sampled).
- Do not add HowTo (deprecated) even though the guides are step-based.
- SearchAction not needed (no site search).

## Recommended JSON-LD (Organization upgrade)
```json
{
  "@type": "Organization",
  "@id": "https://idphoto.us/#organization",
  "name": "idphoto.us",
  "url": "https://idphoto.us",
  "logo": {"@type": "ImageObject", "url": "https://idphoto.us/logo.png", "width": 512, "height": 512},
  "email": "hello@idphoto.us",
  "contactPoint": {"@type": "ContactPoint", "contactType": "customer support", "email": "hello@idphoto.us", "url": "https://idphoto.us/contact"},
  "sameAs": ["https://www.linkedin.com/company/REPLACE_WITH_REAL_PROFILE"],
  "founder": {"@id": "https://idphoto.us/#founder"}
}
```
(Replace sameAs with real profile URLs, or omit; set the actual logo dimensions.)

Article author:
```json
"author": {"@type": "Person", "@id": "https://idphoto.us/#founder", "name": "Navnit Rai", "url": "https://idphoto.us/about"}
```
