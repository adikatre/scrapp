import { expect, test } from "@playwright/test";

test("opening a saved scan image never reclassifies it", async ({ page }) => {
  const identifyRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v2/identify")) identifyRequests.push(request.url());
  });

  await page.addInitScript(() => {
    localStorage.removeItem("scrapp-history-indexeddb-migrated-v1");
    localStorage.setItem(
      "scrapp-scan-history",
      JSON.stringify([
        {
          id: "saved-test",
          timestamp: new Date().toISOString(),
          image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
          guidance: "Put it loose in the blue recycling bin.",
          disposalRoute: "recycle",
          bin: "Blue Bin (Recycling)",
          itemName: "Saved bottle",
          inputMode: "upload"
        }
      ])
    );
  });

  await page.goto("/cam");
  const pastScans = page.getByRole("button", { name: /Past scans/ });
  if ((page.viewportSize()?.width ?? 0) < 768) await pastScans.click();
  await page.getByRole("button", { name: /Saved bottle/ }).click();
  const imageButton = page.getByRole("button", { name: "Open scanned item image" });
  const imageBounds = await imageButton.boundingBox();
  expect(imageBounds).not.toBeNull();
  await page.mouse.click(imageBounds!.x + imageBounds!.width / 2, imageBounds!.y + 100);
  await expect(page.getByRole("heading", { name: "Saved scan" })).toBeVisible();
  await expect(
    page.getByText("Viewing a saved image never sends it for classification again.")
  ).toBeVisible();
  expect(identifyRequests).toEqual([]);
});
