import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * WCAG 2.2 AA checks for every rendered route, in both color schemes, plus the
 * interactive states axe can't reach on page load. See ACCESSIBILITY.md.
 */

const ROUTES = [
  "/",
  "/tool",
  "/tool/passport-photo-editor",
  "/guide",
  "/guide/passport-photo-requirements",
  "/guide/us-passport-photo-size",
  "/faq",
  "/contact",
  "/about",
  "/content-methodology",
  "/editorial-policy",
  "/privacy-policy",
  "/terms",
  "/refund-policy",
  "/this-page-does-not-exist",
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** A 1 × 1 PNG, enough for the editor to accept an upload. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary).toEqual([]);
}

/** Dynamic widgets render a "Loading…" placeholder first; wait until the real UI is in. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Loading…")).toHaveCount(0);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const route of ROUTES) {
      test(`axe: ${route}`, async ({ page }) => {
        await page.goto(route);
        await settle(page);
        await expectNoViolations(page);
      });
    }

    test("axe: home FAQ expanded and country picker open", async ({ page }) => {
      await page.goto("/");
      await settle(page);
      for (const summary of await page.locator("details summary").all()) {
        if (await summary.isVisible()) await summary.click();
      }
      await page.getByRole("button", { name: /Select country/ }).click();
      await expect(page.getByRole("listbox", { name: "Countries" })).toBeVisible();
      await expectNoViolations(page);
    });

    test("axe: editor while processing, then after an error", async ({ page }) => {
      let fail: () => void = () => {};
      await page.route("**/api/photo/process", (route) => new Promise<void>((resolve) => (fail = () => resolve(route.abort()))));
      await page.goto("/tool/passport-photo-editor");
      await settle(page);

      await page.getByLabel("Tap to upload a photo or take a picture").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: TINY_PNG });
      await expect(page.getByRole("status").filter({ hasText: "Checking your face" })).toBeAttached();
      await expectNoViolations(page);

      fail();
      const alert = page.getByRole("alert").filter({ hasText: "Couldn't reach the server" });
      await expect(alert).toBeFocused();
      await expectNoViolations(page);

      await page.getByRole("button", { name: "Try another photo" }).click();
      await expect(page.getByLabel("Tap to upload a photo or take a picture")).toBeFocused();
    });

    test("axe: contact form with validation errors", async ({ page }) => {
      await page.goto("/contact");
      await settle(page);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByLabel("Name")).toBeFocused();
      await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
      await expectNoViolations(page);
    });

    test("axe: feedback comment step", async ({ page }) => {
      await page.goto("/guide/us-passport-photo-size");
      await settle(page);
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await expect(page.locator("#feedback-comment")).toBeFocused();
      await expectNoViolations(page);
    });
  });
}

test.describe("320px wide (WCAG 1.4.10 reflow)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const route of ROUTES) {
    test(`no horizontal scroll: ${route}`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("axe + keyboard: mobile menu", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("summary", { hasText: "Menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await expectNoViolations(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
    await expect(menu).toBeFocused();
  });
});

test.describe("keyboard", () => {
  test("first Tab reaches a visible skip link that moves to main", async ({ page }) => {
    await page.goto("/guide/passport-photo-requirements");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("country picker announces the selection and works by keyboard", async ({ page }) => {
    await page.goto("/tool/passport-photo-editor");
    await settle(page);
    const trigger = page.getByRole("button", { name: /^Select country \/ destination United States/ });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const search = page.getByRole("combobox", { name: "Search country" });
    await expect(search).toBeFocused();
    await page.keyboard.type("Canada");
    await expect(page.getByRole("status").filter({ hasText: /^1 country$/ })).toBeAttached();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /^Select country \/ destination Canada/ })).toBeFocused();
  });

  test("focused elements are never hidden under the sticky header", async ({ page }) => {
    await page.goto("/guide/passport-photo-requirements");
    const header = await page.locator("body > header").boundingBox();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const box = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el.closest("header")) return null;
        const rect = el.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      });
      // WCAG 2.4.11: the focused element must not be entirely hidden by the sticky header.
      if (box && header) expect(box.bottom, `focus stop ${i}`).toBeGreaterThan(header.height);
    }
  });
});
