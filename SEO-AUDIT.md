# SEO audit: idphoto.us

Audit date: October 23, 2026. Target market: English-speaking searchers in the United States (en-US).

## Pages and keyword ownership

Each page owns one primary keyword. No other page may target it. Crop, checker, visa, and near-me terms are reserved for future pages, so no current page targets them.

| Page | Primary keyword | Secondary keywords |
| --- | --- | --- |
| `/` | passport photo online | passport photo maker, free passport photo, us passport picture, make passport photo at home |
| `/tool/passport-photo-editor` | passport photo editor | edit passport photo, passport photo editor online free, passport photo for other countries, international passport photo |
| `/guide/passport-photo-requirements` | us passport photo requirements | passport photo rules, passport photo glasses, passport photo background, passport photo smile, digital passport photo for renewal |
| `/guide` | passport photo guides | id photo requirements, passport photo help |
| `/tool` | free passport photo tools | id photo tools, passport photo tools online |
| `/faq` | passport photo faq | Short answers that link to the page that owns each topic |
| `/about`, `/contact`, `/editorial-policy`, `/content-methodology` | Brand and trust pages | None |
| `/privacy-policy`, `/terms`, `/refund-policy` | Brand legal pages | None |
| `/preview/[id]` | None (noindex, nofollow) | None |

## Issues fixed

### International signals
- Changed `<html lang="en">` to `lang="en-US"` (`src/app/layout.tsx`). Open Graph `og:locale` was already `en_US`. The site has one version, so it has no hreflang, which is correct.

### Keyword cannibalization
- **Critical:** the home page and `/tool/passport-photo-editor` both targeted "passport photo online". The editor now targets "passport photo editor" and the international and edit terms.
- The editor also declared "passport photo background", which the requirements guide owns, and "passport photo size by country", which belongs to the size guide. I removed both.
- The home page declared "passport size photo" variants. These are mostly South Asian and UK phrasings, and they conflict with the rule that the home page doesn't target size terms. I removed them.

### Duplicate FAQ content and FAQPage markup
- `/faq` and the requirements guide both answered the smiling and glasses questions. The requirements guide covers them in its body, so I removed them from its FAQ. The `/faq` answers now link to the guide.
- `/faq` no longer repeats "Can I take my passport photo at home?" The requirements guide owns that question.
- The home page and `/faq` both asked "Do you store my photos?" I kept it on `/faq` only.
- The home page and the editor both asked about printing. The editor's question is now "What pixel size is the download?"
- Every FAQPage block matches the visible text, checked by a crawl of the production build.

### Structured data (`src/lib/seo/json-ld.ts`)
- Organization `logo` was an SVG, which Google doesn't accept for logos. It now points to a 512×512 PNG at `/logo.png` (`src/app/logo.png/route.tsx`).
- Added a `WebPage` node to the home page, linked to WebSite and Organization.
- Added a shared `faqPageJsonLd()` builder, so the home page and content pages produce identical FAQ markup with a stable `@id`.
- Hub pages (`/tool`, `/guide`) now output `CollectionPage` with an `ItemList` of the pages they show.
- `/contact` now uses `ContactPage` schema. `/about` already used `AboutPage`.

### Titles and meta descriptions
| Page | Before | After |
| --- | --- | --- |
| `/contact` | Contact idphoto.us \| idphoto.us (brand repeated, 31 characters) | Contact Us: Questions and Corrections \| idphoto.us |
| `/about` | About idphoto.us: Who We Are and How We Work \| idphoto.us (brand repeated) | About Us: Who We Are and How We Work \| idphoto.us |
| `/content-methodology` | 68 characters | Content Methodology: How We Check Photo Rules \| idphoto.us |
| `/editorial-policy` | 63 characters | Editorial Policy: Our Content Standards \| idphoto.us |
| `/guide/passport-photo-requirements` | 65 characters | U.S. Passport Photo Requirements Checklist \| idphoto.us |
| `/guide` | 39 characters, no U.S. signal | Passport Photo Guides: U.S. Rules and Sizes \| idphoto.us |
| `/tool` | 43 characters; description 128 characters | Free Passport Photo Tools for 60+ Countries \| idphoto.us; new 150-character description |
| `/privacy-policy`, `/terms`, `/refund-policy` | 26–29 characters | 50–54 characters, each with a descriptive phrase |
| `/faq` | Description listed topics only | Description ends with an action: "Find your answer, then make your photo." |

### Accuracy and trust
- The site description, `/faq`, `/about`, and `/content-methodology` mentioned a "photo compressor" that has no published page. I removed those mentions. The legal pages still mention it (see below).
- The social card footer said "Private by design," but the photo editor uploads photos. It now says "Official sources cited."
- `/about` no longer calls the tools "private," for the same reason.

### Crawling
- Removed the non-standard `Host:` line from `robots.txt`. Google ignores it.

### Mobile and icons
- Added `src/app/apple-icon.tsx`, a 180×180 PNG, because iOS ignores SVG icons.

### Home page cleanup
- Removed the four placeholder link targets for pages that don't exist yet (cropper, checker, visa, near me) and their TODO comment.

## Checked and already correct
- Every page goes through `buildMetadata()` and gets a self-referencing absolute canonical, Open Graph, Twitter, and robots tags. `metadataBase` comes from `NEXT_PUBLIC_SITE_URL`, which defaults to `https://idphoto.us`.
- Mixed-case URLs and trailing slashes return a 308 to one lowercase URL. Unknown paths return a real 404 with `noindex`.
- The sitemap lists exactly the 14 indexable pages, as URLs only (no `<lastmod>`). Result pages under `/preview/` are `noindex, nofollow, noarchive` and left out of the sitemap.
- Indexing is always on: every build outputs `index, follow` and a `robots.txt` that allows everything except `/api/`. Individual pages opt out with `indexable: false` (the 404 page and `/preview/[id]`).
- Titles, meta tags, JSON-LD, and the H1 all appear in server HTML. The photo widget is the only client-rendered content.
- Breadcrumbs appear on the page and in BreadcrumbList JSON-LD on every content page.
- Every page has its own 1200×630 social image (`/og/...`).
- The hero image uses `next/image` with `preload`, explicit dimensions, and AVIF and WebP output. Fonts load through `next/font`. Widgets are code-split and reserve their space while loading.
- Security headers are set: HSTS with preload, CSP, `nosniff`, and frame denial.
- The footer links to the privacy policy, terms, contact, about, and editorial policy pages.

## Verification results
- `next build` passes with no errors or warnings. `npm run lint` (ESLint plus the design-token check) passes.
- View-source check on `/`, `/tool`, and `/tool/passport-photo-editor`: title, description, canonical, `og:url`, `og:locale`, `og:image`, JSON-LD, and one H1 all appear in server HTML.
- Crawl of the production build: 14 pages, all 200, no broken internal links, no redirect chains, no orphans. Every page is one click from any other page through the footer.

Title and description lengths (title includes " | idphoto.us"):

| Page | Title | Description |
| --- | --- | --- |
| `/` | 48 | 153 |
| `/tool` | 56 | 150 |
| `/guide` | 56 | 159 |
| `/faq` | 58 | 152 |
| `/about` | 49 | 157 |
| `/guide/passport-photo-requirements` | 55 | 158 |
| `/tool/passport-photo-editor` | 52 | 156 |
| `/editorial-policy` | 52 | 157 |
| `/content-methodology` | 58 | 147 |
| `/contact` | 50 | 148 |
| `/data-security` | 54 | 148 |
| `/privacy-policy` | 54 | 147 |
| `/terms` | 56 | 151 |
| `/refund-policy` | 53 | 153 |

All titles are 25–60 characters and all descriptions 70–160, measured by a crawl of the production build.

## Remaining issues and items needing human input

1. **Done: indexing gate removed.** Indexing no longer depends on `NEXT_PUBLIC_SITE_ENV`, which had shipped the live site as `noindex` with a disallow-all `robots.txt`. Set `NEXT_PUBLIC_SITE_URL` to the final domain in production.
2. **Done: non-www.** `https://idphoto.us` is the canonical host, and `next.config.ts` 301-redirects `www.idphoto.us` to it, keeping the path and query. Your host still needs to redirect `http://` to `https://`.
3. **Done: photo compressor removed.** I deleted the component, its widget registration, its unused helpers, and every mention in the content, legal pages, and docs.
4. **Done: owner.** `/about` names Navnit Rai as the owner, and Organization markup includes him as `founder`. You can still add a location (city and state) if you want to.
5. **Done: reviewer.** The U.S. requirements guide credits the PixPassport.com team as "Reviewed by", with a link to the site. Markup uses `reviewedBy` and `lastReviewed` on the WebPage. `/about` and the editorial policy disclose that PixPassport also provides the photo processing service.
6. **Legal review:** the privacy policy and terms carry OWNER REVIEW notes asking for a lawyer's review before launch.
7. **Social profiles:** if the brand has social accounts, add them as `sameAs` on Organization and add a `twitter:site` handle.
8. **FAQ answer length:** most FAQ answers run 20 to 40 words, below the 40 to 60 words some guidelines suggest. I didn't pad them, because longer answers would need new facts. Google currently shows FAQ rich results only for well-known government and health sites, so the markup mainly helps understanding.
9. **Lighthouse:** Lighthouse isn't installed, and installing it would add a package. Run it on the deployed site, or locally with `npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile` (once for `/` and once for `/guide/passport-photo-requirements`).
10. **Low, 404 page HTML:** unknown paths correctly return a 404, but the not-found message is filled in by client-side JavaScript rather than sent in the server HTML. This doesn't affect indexing.
11. **Done: preview bug.** `getPhotoResult()` now calls `connection()` before its expiry check, so `/preview/[id]` no longer logs a prerender error.
12. **Future pages:** the cropper, checker, visa photo requirements, and passport-photo-near-me pages each own their keyword when they launch. Link to them from the home page then.

## Post-launch checklist
- [ ] Verify the domain in Google Search Console (DNS record, domain property).
- [ ] Submit `https://idphoto.us/sitemap.xml` in Search Console.
- [ ] Set up Bing Webmaster Tools. You can import the site from Search Console.
- [ ] Request indexing for `/`, `/tool/passport-photo-editor`, and `/guide/passport-photo-requirements`.
- [ ] Test each of those URLs in Google's Rich Results Test and the Schema Markup Validator.
- [ ] Monitor the Core Web Vitals and Page indexing reports weekly for the first month.
- [ ] Track U.S. rankings for each page's primary keyword from the ownership table above.
- [ ] Update `updatedAt` only when a page's content changes in a meaningful way.
