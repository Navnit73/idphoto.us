# Content guide

Every public page except the home page is a Markdown file in `content/`. Add a file, and the route, metadata, sitemap entry, breadcrumbs, structured data, and social image are generated from it. You don't need to change any code.

## Where files go

| Folder            | `category` | URL                       | Example                                   |
| ----------------- | ---------- | ------------------------- | ----------------------------------------- |
| `content/tools/`  | `tool`     | `/tool/<slug>`            | `/tool/passport-photo-editor`             |
| `content/guides/` | `guide`    | `/guide/<slug>`           | `/guide/us-passport-photo-size`           |
| `content/about/`  | `about`    | `/<slug>`                 | `/about`, `/contact`, `/faq`              |
| `content/legal/`  | `legal`    | `/<slug>`                 | `/privacy-policy`, `/terms`               |

An `index.md` file with `slug: ""` and `template: hub` becomes the category landing page (`/tool`, `/guide`). It lists every indexable page in that category automatically.

The `category` must match the folder; the build fails otherwise.

## Frontmatter reference

```yaml
---
# Required
title: "U.S. Passport Photo Size: Inches, mm & Pixels"   # <title>; " | idphoto.us" is appended. 10–60 chars.
description: "A U.S. passport photo is 2 × 2 inches…"        # Meta description + intro. 70–165 chars.
slug: us-passport-photo-size                             # kebab-case; "" only for hubs
category: guide                                          # tool | guide | about | legal
template: guide                                          # tool | guide | faq | legal | info | hub
updatedAt: 2026-10-23                                    # shown on the page and in the sitemap

# Optional
heading: "U.S. passport photo size in inches…"   # visible H1 (defaults to title)
breadcrumbLabel: "Passport photo size"           # short name for breadcrumbs and hub cards
publishedAt: 2026-10-23
published: true                                  # false = not built, not linked, 404
indexable: true                                  # false = noindex + left out of the sitemap
canonical: /guide/other-page                     # only to consolidate duplicates (see below)
robots: { follow: true, noarchive: false, maxImagePreview: large }
keywords: [passport photo size, 2x2 photo]
ogImage: /images/og/custom.png                   # default: generated card at /og/<path>
schemaType: Article                              # override the template default (see below)
showTableOfContents: true
showDisclaimer: true                             # "not an official source" notice
widget: photo-editor                             # photo-editor | contact-form
ctaLabel: "Make my passport photo"               # tool only: header button that scrolls to the widget
heroImage: { src: /images/x.webp, width: 1200, height: 600, alt: "…" }  # tool only: image beside the header (/public or our Cloudinary)
country: IN                                      # photo-editor only: preselected country (code from src/lib/photo/countries.ts)
relatedPages: [/guide/passport-photo-requirements, /tool/passport-photo-editor]
author: editorial-team                           # id from content/authors.json
reviewedBy: some-author-id                       # ONLY if that person really reviewed the page
sources:
  - title: "U.S. Passport Photos"
    url: "https://travel.state.gov/…"
    publisher: "U.S. Department of State"
faq:
  - question: "Can I smile in my passport photo?"
    answer: "Yes. A natural smile is fine… Markdown links like [this](/faq) work."
---
```

## Templates

| Template | Use for                         | Renders                                                                                   | Default schema   |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- |
| `tool`   | Interactive tools               | H1 with a button that scrolls to the widget and an optional hero image, then the widget, explanation, FAQ, sources, feedback, and related pages | `WebApplication` |
| `guide`  | Long-form articles              | Byline, reading time, sticky table of contents, optional widget, body, FAQ, sources, feedback, related | `Article`        |
| `faq`    | Q&A pages                       | FAQ entries first, then the body                                                          | `FAQPage`        |
| `legal`  | Policies                        | A narrow reading column with the last-updated date                                        | `WebPage`        |
| `info`   | About, contact, policies        | Body, then an optional widget (for example, the contact form), FAQ, and related pages     | `WebPage`        |
| `hub`    | Category landing pages          | Cards for every page in the category, then the intro text                                 | `CollectionPage` |

To add a template, create a component in `src/components/templates/`, register it in `src/components/templates/index.tsx`, and add its name to `TEMPLATES` in `src/lib/content/schema.ts`.

To add a widget, create a client component, register it in `src/components/widgets/registry.tsx`, and add it to `WIDGETS`. Widgets are loaded on demand, so a page only downloads the widgets it uses.

### Embedding the photo editor

`photo-editor` uploads the photo to the PixPassport API and opens the result at `/preview/<id>`. It works on `tool`, `guide`, and `info` pages. Set `country` to preselect a country, for example on a country guide:

```yaml
widget: photo-editor
country: IN        # India; use the API code, e.g. GB, CA, EU (Schengen), CHE (Switzerland)
```

Because this widget uploads photos, any page that embeds it must not claim that photos stay on the device.

## Writing rules (enforced at build time)

`npm run build` fails, naming the file and the problem, if any of these rules are broken:

- **Headings:** the template renders the only H1, so start the body at `##`. Don't skip levels (`##` → `####`) or go deeper than `####`.
- **Unique titles and descriptions** across all indexable pages.
- **No thin pages:** indexable pages need a minimum word count (guide 600, tool 300, legal 250, info 200, faq 150, hub 80). FAQ answers count toward the total. If a page has to stay short, set `indexable: false`.
- **No broken internal links:** every `/path` link in the body or FAQ, and every `relatedPages` entry, must point to a published page.
- **Canonicals must be valid:** a canonical has to point to an existing, indexable page that isn't itself canonicalized to another page.
- **Images** must be local files in `public/`, and every image needs alt text. Their dimensions are read automatically. Put an image on its own line to render it as a figure; the text in quotes after the path becomes the caption:
  `![Alt text](/images/guides/diagram.svg "Caption text")`
- Raw HTML in Markdown is removed, so content can't inject markup or scripts.

## Duplicate content and canonicals

- Each page has one URL. Mixed-case URLs redirect to lowercase (`src/proxy.ts`), and unknown paths return a real 404.
- By default a page's canonical points to itself. Set `canonical` only when two pages would otherwise compete for the same search. The page then stays reachable but is left out of the sitemap.
- Preview and staging deployments are always `noindex`; see [DEPLOYMENT.md](DEPLOYMENT.md).

## E-E-A-T checklist for new pages

- Cite primary, official sources in `sources` and link them where you make the claim.
- Set `updatedAt` only for meaningful content changes.
- Use `showDisclaimer: true` on anything describing official requirements.
- Never invent credentials, reviewers, statistics, or guarantees. `reviewedBy` must name a real person who actually reviewed the page.
- State limits plainly: what a tool doesn't do, and that the agency makes the final decision.
