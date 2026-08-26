// @ts-check
const { test, expect } = require("@playwright/test");

const TABS = [
  "overview",
  "scheduler",
  "vitals",
  "careteam",
  "vault",
  "geofence",
  "wellness",
  "setup-parent",
  "setup-child",
];

/** The main navigation sits behind the hamburger menu on every viewport. */
async function openTab(page, tab) {
  await page.click("#btn-hamburger");
  await page.click(`button[data-tab='${tab}']`);
}

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

/**
 * Tailwind is loaded from a CDN. Environments without outbound network access
 * render the page unstyled, in which case layout assertions are meaningless.
 */
async function isTailwindLoaded(page) {
  return page.evaluate(() => typeof window.tailwind !== "undefined");
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}

test.describe("basa - Responsive layout", () => {
  for (const viewport of VIEWPORTS) {
    test(`No horizontal overflow on ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      test.skip(!(await isTailwindLoaded(page)), "Tailwind CDN unavailable in this environment");

      for (const tab of TABS) {
        await openTab(page, tab);
        await expect(page.locator(`#panel-${tab}`)).toBeVisible();
        expect(await hasHorizontalOverflow(page), `overflow on ${tab} tab`).toBe(false);
      }
    });
  }

  test("Navigation tabs remain reachable on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Every navigation entry is reachable through the hamburger drawer
    for (const tab of TABS) {
      await page.click("#btn-hamburger");
      const btn = page.locator(`button[data-tab='${tab}']`);
      await expect(btn).toBeVisible();
      await btn.click();
      await expect(page.locator(`#panel-${tab}`)).toBeVisible();
      await expect(page.locator("#sidebar")).toBeHidden();
    }
  });

  test("Header controls stay usable on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.locator("#btn-hamburger")).toBeVisible();
    await expect(page.locator("#btn-quick-sos")).toBeVisible();
    await expect(page.locator("#parent-status-badge")).toBeVisible();
    await expect(page.locator("#btn-view-parent")).toBeVisible();

    // SOS flow still works when the header wraps onto multiple rows.
    // The button carries a permanent bounce animation, so force the click.
    await page.click("#btn-quick-sos", { force: true });
    await expect(page.locator("#flash-emergency-banner")).toBeVisible();
    await page.click("#btn-resolve-sos");
    await expect(page.locator("#flash-emergency-banner")).toBeHidden();
  });

  test("Viewport meta tag enables mobile scaling", async ({ page }) => {
    await page.goto("/");
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("width=device-width");
    expect(content).toContain("initial-scale=1");
  });
});
