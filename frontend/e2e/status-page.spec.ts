import { expect, test } from "@playwright/test";

test("setup check /status: empty logo space, API + database connected, no sideways scroll", async ({ page }) => {
  await page.goto("/status");
  await expect(page).toHaveTitle("Setup check - Side Licks");

  // Rule: NO logo anywhere until the owner sends it (F5). The slot exists but is empty.
  const slot = page.locator('[data-slot="logo"]');
  await expect(slot).toBeVisible();
  await expect(slot).toBeEmpty();
  await expect(page.locator("img, svg")).toHaveCount(0);
  const favicon = await page.request.get("/favicon.ico");
  expect(favicon.status()).toBe(404);

  await expect(page.getByTestId("api-status")).toHaveAttribute("data-state", "up");

  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(sideways).toBe(false);
});
