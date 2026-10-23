# Accessibility

idphoto.us targets **WCAG 2.2 Level AA**. This file records the October 2026 audit: what was checked, what was fixed, what still needs a person to decide, and how we keep it from regressing.

## How it's checked

| Check | Command | What it covers |
| --- | --- | --- |
| Lint | `npm run lint` | `eslint-plugin-jsx-a11y` **strict** rule set (33 rules) plus the design-token check |
| Automated scan | `npm run test:a11y` | Builds the site, then runs [axe-core](https://github.com/dequelabs/axe-core) with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` on every route in light **and** dark mode, plus keyboard and focus tests (`tests/a11y.spec.ts`) |

The Playwright suite has 57 tests:

- axe on all 15 routes, in both color schemes
- axe on interactive states that don't exist on page load: home FAQ expanded, country picker open, editor processing, editor error, contact form errors, feedback comment step, mobile menu open
- no horizontal scroll at 320 px on every route (1.4.10)
- keyboard: the skip link, the country picker by keyboard alone, Escape on the mobile menu, focus never hidden under the sticky header (2.4.11), and focus moving to errors and results

**Before / after.** Run against the pre-audit commit (`ce4ffee`), 23 of 57 tests failed: 17 dark-mode contrast failures and 6 focus or name failures. After the fixes, all 57 pass and lint reports 0 problems. The suite was also checked to catch regressions: reverting one token fix makes it fail.

## Pages audited

| Page | Template | Status |
| --- | --- | --- |
| Layout: header, skip link, nav, mobile menu, theme toggle, footer | `src/app/layout.tsx` | ✅ Pass |
| `/` | Home | ✅ Fixed |
| `/tool/passport-photo-editor` | tool + photo editor | ✅ Fixed |
| `/preview/[id]` | photo download | ⚠️ Fixed, but code review only (see limitations) |
| `/guide/passport-photo-requirements`, `/guide/us-passport-photo-size` | guide | ✅ Fixed |
| `/guide`, `/tool` | hub | ✅ Fixed |
| `/faq` | faq | ✅ Fixed |
| `/contact` | info + contact form | ✅ Fixed |
| `/about`, `/content-methodology`, `/editorial-policy` | info | ✅ Fixed |
| `/privacy-policy`, `/terms`, `/refund-policy` | legal | ✅ Fixed |
| 404 and error boundary | `not-found.tsx`, `error.tsx` | ✅ Fixed (404 shared the header contrast issue) |

Most page fixes came from shared tokens and components, so one change covered every page.

## Issues found and fixed

Severity: **Critical** blocks a task. **Serious** makes a task very hard. **Moderate** causes friction. **Minor** is polish.

### 1.4.3 Contrast (Minimum)

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Serious | `src/styles/tokens.css` (dark) | Primary buttons were white on brand-500 (3.67:1; hover 2.61:1). This affected every CTA, the header logo badge and the step icons. | Dark `--primary` is now brand-400, `--primary-hover` brand-300, `--primary-foreground` neutral-950 (7.57:1, hover 10.95:1) |
| Serious | `tokens.css` (dark) | Primary-colored text on raised dark surfaces was 3.99:1. This covered card category labels, "Read guide →" and links inside FAQ cards. | Same token change (5.60:1) |
| Moderate | `src/app/page.tsx` | Large "1 2 3" step numbers used `text-border-strong` (1.47:1) | `text-muted-foreground` (7.57:1) |

### 1.4.11 Non-text Contrast

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Serious | `src/components/ui/field.tsx`, `src/components/tools/country-picker.tsx` | Input, select, textarea and picker borders were 1.47:1 (light) and 1.92:1 (dark), so fields were hard to find | New `--input` token (neutral-500, ≥3.07:1 on every surface), used as `border-input` |

### 4.1.2 Name, Role, Value

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Serious | `country-picker.tsx` | The `<label for>` overrode the trigger button's name, so screen readers heard "Select country / destination" but never the selected country | `aria-labelledby` = label + selected value. The button now reads "Select country / destination, United States (US)". |

### 4.1.3 Status Messages

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Serious | `src/components/tools/photo-editor.tsx` | The progress `role="status"` was created at the same moment as its first message, so "Preparing…" and later steps were often not announced | A persistent `sr-only` live region announces each step |
| Moderate | `src/components/tools/photo-download.tsx` | "We also emailed you the link" appeared silently | Rendered inside a persistent `role="status"` |
| Moderate | `country-picker.tsx` | "No country matches" was inserted silently | A persistent status announces "N countries" or "No country matches" as you type |
| Minor | `src/components/widgets/feedback.tsx` | "Sending…" was not announced | `role="status"` |

### 3.3.1 Error Identification and 2.4.3 Focus Order

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Serious | `src/components/widgets/contact-form.tsx` | Submitting with errors showed messages but didn't announce them or move focus | Errors render (`flushSync`), then focus moves to the first `aria-invalid` field, whose error is read through `aria-describedby`. Server-side field errors get the same treatment. |
| Moderate | `photo-download.tsx` | Focus moved to the email field before its error existed, so the error wasn't read | Render first, then focus |
| Moderate | `contact-form.tsx`, `feedback.tsx`, `photo-editor.tsx` | The control you'd just used was removed (Send, Yes/No, upload), dropping focus to `<body>` | `Alert` gained a `focus` prop that moves focus to the result or error. Feedback moves focus to the comment box. "Try another photo" returns focus to the file input. |

### 1.3.1 Info and Relationships

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Moderate | `src/components/templates/tool-template.tsx`, `guide-template.tsx` | Heading skipped from H1 to the widget's H3 | Visually hidden H2 labels the tool section |
| Moderate | `src/components/tools/file-drop.tsx` | The file input's name was the whole drop zone: label, formats and privacy note | Named by the label only; formats and privacy note are its description |

### 2.4.7 Focus Visible

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Minor | `file-drop.tsx` | Keyboard focus on the drop zone showed only as a border color change | Ring outline while the hidden input has `:focus-visible` |

### 1.4.10 Reflow and 1.1.1 Non-text Content

| Severity | Where | Problem | Fix |
| --- | --- | --- | --- |
| Minor | `page.tsx` | Country tiles truncated long names at narrow widths or high zoom | Names wrap |
| Minor | `photo-editor.tsx` | Redundant alt text "Your uploaded photo" | "Your upload" |

### Already compliant (verified, no change)

- `lang="en"` on `<html>`, plus a skip link that is first in tab order and visible on focus
- header, nav, main and footer landmarks, with breadcrumbs marked `aria-current`
- titles through `buildMetadata()`
- one H1 per page from templates, and Markdown starting at H2
- every content image has meaningful alt text, and decorative SVGs are `aria-hidden`
- the theme toggle uses `aria-pressed`, and the mobile menu uses `<details>` (works before hydration, closes on Escape and returns focus)
- the full-size photo is a native modal `<dialog>`, with focus trap, Escape and focus return built in
- the global `:focus-visible` ring is 3.5:1 or better
- `scroll-padding-top` keeps focused and anchored content clear of the sticky header
- `prefers-reduced-motion` disables animation and smooth scrolling
- the scrolling table wrapper is focusable for keyboard users
- targets are 24 px or larger, or spaced, and pass axe `target-size`

### Lint exceptions

Four lines carry an `eslint-disable` with a written reason. Each is a deliberate pattern, not a gap:

- the scrolling table region's `tabIndex` (needed for 2.1.1)
- drag-and-drop handlers on the drop zone (the file input is the keyboard path)
- the country `option`s' click handler (the keyboard drives the combobox through `aria-activedescendant`)
- backdrop-click-to-close on the dialog (Escape and the Close button are the keyboard path)

## Needs a human decision

1. **Dark-mode button style (brand).** Dark-mode primary buttons changed from white text on mid-blue to near-black text on a lighter blue. Keeping white text would need a separate, darker fill token for buttons plus a lighter one for links. That's a valid alternative if the brand needs white-on-blue, but it's more tokens to maintain.
2. **Form borders are visibly darker** (neutral-500 instead of neutral-300). That's required for 1.4.11. Decorative borders on cards and dividers are unchanged.
3. **Required fields.** Every contact form field is required. This is exposed to assistive tech (`required`) but not shown visually. Adding "All fields are required" above the form would help (3.3.2). It's a copy change, so it was left for you.

## Known limitations

- **`/preview/[id]` isn't in the automated scan.** It needs a real processed photo from MongoDB. It was reviewed in code and its fixes are in place. To cover it, seed a test result or add a fixture route.
- **`photo-compressor`** is registered as a widget but no page uses it. It passes lint and shares `FileDrop`, but hasn't been scanned.
- **axe can't judge everything.** Non-text contrast of borders (1.4.11) was checked by calculation, not by axe. Screen reader output, meaningful alt text, and text spacing (1.4.12) need the manual checks below.
- **Home FAQ:** the questions are `<h3>`s inside `<summary>`. HTML allows this, but some screen readers drop the heading role there. Acceptable; keep an eye on it.

## Manual checks (before each release that touches UI)

1. **Keyboard only.** Tab through home, the editor and contact. Use the country picker with arrows, typing, Enter and Escape. Upload with Enter or Space on the drop zone. Open and close the photo dialog on a preview page.
2. **Screen reader (VoiceOver + Safari, NVDA + Firefox).**
   - The picker announces the selected country.
   - Upload progress steps are read.
   - A failed upload reads the error.
   - Submitting an empty contact form lands on "Name" and reads its error.
   - The feedback flow lands on the comment box, then on "Thanks…".
3. **Zoom to 200% and 400%** (or a 320 px window). Nothing is cut off and there's no sideways scrolling.
4. **Text spacing.** Apply a text-spacing bookmarklet (line height 1.5, letter spacing 0.12em). No text overlaps or is clipped.
5. **Reduced motion.** With the OS setting on, spinners and the FAQ "+" don't animate.

## Optional AAA improvements

- **1.4.6 Contrast (Enhanced, 7:1):** body and muted text already pass. Primary links (5.16:1 light) don't.
- **2.5.5 Target Size (Enhanced, 44 px):** the theme toggle buttons are 28 px, the menu button and small buttons 36 px.
- **2.4.13 Focus Appearance:** the 2 px ring with offset likely meets it. It hasn't been measured on every component.

## CI recommendation

Run lint and the axe suite on every pull request, and block merges on failure. `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

The site builds and renders without MongoDB, SMTP or PixPassport keys, so CI needs no secrets. The tests intercept the photo upload, so nothing reaches PixPassport. When you add a page, add its route to `ROUTES` in `tests/a11y.spec.ts`.
