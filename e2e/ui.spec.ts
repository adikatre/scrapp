import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page is visible, usable, and has no serious accessibility violations", async ({
  page
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Snap it. Sort it right." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scan an item" }).first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious"
    )
  ).toEqual([]);
});

test("camera starts with an explicit permission choice and upload fallback", async ({ page }) => {
  await page.goto("/cam");
  await expect(
    page.getByRole("heading", { name: /Show Scrapp what you are sorting/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Use camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload a photo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
});

test("locations prioritizes list controls on mobile and keeps map optional", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile information order check");
  await page.goto("/locations");
  await expect(page.getByRole("heading", { name: "Find a Drop-Off Place" })).toBeVisible();
  await expect(page.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Use my location/i })).toBeVisible();
});
