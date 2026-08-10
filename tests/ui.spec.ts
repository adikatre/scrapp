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
  await expect(page.getByRole("heading", { name: "Find a drop-off" })).toBeVisible();
  await expect(page.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Use my location/i })).toBeVisible();
});

test("desktop location selection updates the URL and refreshes the search context", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop category selector check");
  let locationSearches = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/locations") {
      locationSearches++;
    }
  });

  await page.goto("/locations?category=recycle&q=stale+scanner+query");
  const categorySelect = page.getByRole("combobox", { name: "Disposal category" });
  await expect(categorySelect).toBeVisible();
  await expect.poll(() => locationSearches).toBeGreaterThan(0);
  const searchesBeforeQueryChange = locationSearches;
  await page.evaluate(() => {
    window.history.replaceState(null, "", "/locations?category=recycle&q=glass+drop-off");
  });
  await expect(page).toHaveURL(/q=glass\+drop-off$/);
  await expect.poll(() => locationSearches).toBeGreaterThan(searchesBeforeQueryChange);

  await categorySelect.click();
  await page.getByRole("option", { name: "General Trash" }).click();
  await expect(page).toHaveURL(/\/locations\?category=general_trash$/);
  await expect(page.getByText(/No special facility is needed/)).toBeVisible();

  const searchesBeforeItemSelection = locationSearches;
  await categorySelect.click();
  await page.getByRole("option", { name: "Hazardous — Batteries" }).click();
  await expect(page).toHaveURL(/\/locations\?category=hazardous&item=battery$/);
  await expect(categorySelect).toContainText("Hazardous — Batteries");
  await expect(page.getByLabel("Filter drop-off results")).toBeVisible();
  await expect.poll(() => locationSearches).toBeGreaterThan(searchesBeforeItemSelection);
});

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8Z8AAAAASUVORK5CYII=",
  "base64"
);

test("photo analysis uses explicit v2 endpoints and never posts to the page route", async ({
  page
}) => {
  const postPaths: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") postPaths.push(new URL(request.url()).pathname);
  });

  await page.route("**/api/v2/identify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [
          {
            id: "battery",
            name: "Household battery",
            material: "battery",
            condition: "used",
            packagingClues: [],
            hazards: ["Do not place in a curbside bin."],
            confidence: 0.96
          }
        ],
        uncertainty: "",
        requiresChoice: false,
        model: "test-model",
        durationMs: 12,
        requestId: "test-identify"
      })
    })
  );
  await page.route("**/api/v2/decide", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        decision: {
          id: "battery-rule:sd-city-serviced-home",
          materialId: "battery",
          materialName: "Household battery",
          itemName: "Household battery",
          route: "hazardous-waste",
          bin: "Special Drop-off",
          instruction: "Keep batteries out of curbside bins.",
          preparation: ["Tape the terminals before transport."],
          safety: ["Store in a non-metal container."],
          exceptions: [],
          locationEligible: true,
          searchQueries: ["battery drop-off"],
          jurisdiction: {
            id: "us-ca-san-diego",
            country: "US",
            region: "CA",
            municipality: "San Diego",
            timezone: "America/Los_Angeles",
            supportedLocales: ["en"],
            status: "supported"
          },
          serviceProfile: {
            id: "sd-city-serviced-home",
            jurisdictionId: "us-ca-san-diego",
            name: "City-serviced home",
            propertyType: "city-serviced-home"
          },
          ruleVersion: "battery-rule-v1",
          source: {
            id: "city-source",
            publisher: "City of San Diego",
            title: "What Goes Where",
            url: "https://www.sandiego.gov/environmental-services/recycling",
            language: "en",
            lastChecked: "2026-08-09",
            verification: "official"
          },
          effectiveDate: "2026-01-01",
          lastChecked: "2026-08-09",
          confidence: 0.96,
          coverage: "confirmed"
        },
        requestId: "test-decide"
      })
    })
  );

  await page.goto("/cam");
  await page.locator('input[type="file"]').setInputFiles({
    name: "battery.png",
    mimeType: "image/png",
    buffer: tinyPng
  });
  await page.getByRole("button", { name: "Analyze item" }).click();

  await expect(page.getByText("Household battery", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Special Drop-off", { exact: true }).first()).toBeVisible();
  expect(postPaths).toContain("/api/v2/identify");
  expect(postPaths).toContain("/api/v2/decide");
  expect(postPaths).not.toContain("/cam");
});

test("classifier configuration failures remain actionable and preserve the photo", async ({
  page
}) => {
  await page.route("**/api/v2/identify", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "classifier_unavailable",
          message: "Photo identification is not configured on this deployment.",
          requestId: "test-unavailable"
        }
      })
    })
  );

  await page.goto("/cam");
  await page.locator('input[type="file"]').setInputFiles({
    name: "item.png",
    mimeType: "image/png",
    buffer: tinyPng
  });
  await page.getByRole("button", { name: "Analyze item" }).click();

  await expect(
    page.getByRole("heading", { name: "Photo identification is not configured" })
  ).toBeVisible();
  await expect(
    page.getByText("Photo identification is not configured on this deployment.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try this photo again" })).toBeVisible();
});

test("Describe completes through the real identify and decide route handlers", async ({ page }) => {
  test.setTimeout(60_000);
  const postPaths: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") postPaths.push(new URL(request.url()).pathname);
  });

  await page.goto("/cam");
  await page.getByRole("button", { name: "Describe" }).click();
  await page.getByPlaceholder("Example: greasy pizza box").fill("household battery");
  const decisionResponse = page.waitForResponse((response) =>
    response.url().includes("/api/v2/decide")
  );
  await page.getByRole("button", { name: "Check local guidance" }).click();
  expect((await decisionResponse).ok()).toBe(true);

  await expect(page.getByRole("article").getByRole("heading", { name: "Battery" })).toBeVisible({
    timeout: 15_000
  });
  await expect(page.getByText(/Keep every battery out/).first()).toBeVisible();
  await expect(page.getByText("Special Drop-off", { exact: true }).first()).toBeVisible();
  expect(postPaths).toContain("/api/v2/identify");
  expect(postPaths).toContain("/api/v2/decide");
  expect(postPaths).not.toContain("/cam");
});
