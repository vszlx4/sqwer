import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/* Landing page: every section shows under reduced motion, axe is clean in both themes, keyboard reaches the actions. */

/** Section headings in main that are missing, transparent or offset. */
function unseen(page: Page) {
  return page.locator("main").evaluate((main) =>
    [...main.querySelectorAll<HTMLElement>("section")].flatMap((section) => {
      const name = section.getAttribute("aria-labelledby") ?? section.className;
      const box = section.getBoundingClientRect();
      if (!box.width || !box.height) return [`${name}: no size`];
      const heading = section.querySelector<HTMLElement>("h1, h2");
      if (!heading) return [];
      const style = getComputedStyle(heading);
      return style.opacity !== "1" ||
        style.visibility !== "visible" ||
        heading.style.transform
        ? [`${name}: heading hidden`]
        : [];
    }),
  );
}

const sizes = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const size of sizes) {
    test(`every section shows at once on ${size.name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.locator("main section").count()).toBeGreaterThanOrEqual(
        5,
      );
      expect(await unseen(page)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }

  for (const theme of ["light", "dark"]) {
    test(`axe finds nothing in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript(
        (t) => localStorage.setItem("sqwer:theme", t),
        theme,
      );
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const axe = await new AxeBuilder({ page }).include("main").analyze();
      expect(axe.violations).toEqual([]);
    });
  }
});

test("the keyboard reaches every action in main", async ({ page }) => {
  await page.goto("/");
  const actions = await page
    .locator("main")
    .evaluate((main) =>
      [...main.querySelectorAll<HTMLElement>("a[href], button")]
        .filter((el) => el.checkVisibility())
        .map(
          (el) =>
            el.textContent?.trim() ||
            el.getAttribute("aria-label") ||
            el.tagName,
        ),
    );
  expect(actions.length).toBeGreaterThan(0);
  const reached = new Set<string>();
  for (let i = 0; i < 80 && reached.size < actions.length; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.closest("main")
        ? el.textContent?.trim() || el.getAttribute("aria-label") || el.tagName
        : null;
    });
    if (label) reached.add(label);
  }
  expect(actions.filter((a) => !reached.has(a))).toEqual([]);
});
