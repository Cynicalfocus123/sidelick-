import { expect, test, type Page } from "@playwright/test";

// Step 1A home page. Runs at desktop / laptop / tablet / phone (playwright.config.ts projects).
// /home is for signed-in people only (F121), so every test signs up a fresh account first (real API + database).
test.beforeEach(async ({ page }) => {
  const email = `home-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const res = await page.request.post("http://localhost:4000/api/auth/register", { data: { email, password: "good password 1", isAdult: true, acceptTerms: true } });
  expect(res.status()).toBe(201);
});

async function rowsSnapshot(page: Page) {
  return page.getByTestId("video-row").evaluateAll((rows) =>
    rows.map((r) => Array.from(r.querySelectorAll<HTMLElement>("[data-video]")).map((v) => ({ id: v.dataset.video!, creator: v.dataset.creator! }))),
  );
}

test("layout: left menu, Discover first, empty logo space, no sideways scroll", async ({ page }) => {
  await page.goto("/home");
  const menu = page.getByTestId("side-menu");
  await expect(menu).toBeVisible();
  const box = (await menu.boundingBox())!;
  expect(box.x).toBe(0); // menu always on the LEFT, every size
  expect(box.height).toBeGreaterThan(400);

  await expect(page.getByRole("tab", { name: "Discover" })).toHaveAttribute("aria-selected", "true");
  for (const slot of await page.locator('[data-slot="logo"]').all()) await expect(slot).toBeEmpty();
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.getByTestId("live-now")).toBeVisible();
  await expect(page.getByTestId("video-row").first().getByTestId("video")).toHaveCount(12);
  await expect(page.getByTestId("creator-row").first()).toBeVisible();

  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(sideways).toBe(false);

  const wide = page.viewportSize()!.width >= 1024;
  await expect(page.getByRole("button", { name: "Following", exact: true })).toBeVisible({ visible: wide });
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeVisible({ visible: !wide });
  if (!wide) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "More" })).toBeVisible();
  }
});

test("continuous scroll: new rows load by themselves, no repeated video, creators spaced out", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByTestId("video-row").first()).toBeVisible();
  const before = await page.getByTestId("video-row").count();
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(500);
  }
  await expect.poll(async () => page.getByTestId("video-row").count()).toBeGreaterThan(Math.max(before, 3));

  const rows = await rowsSnapshot(page);
  const ids = rows.flat().map((v) => v.id);
  expect(new Set(ids).size).toBe(ids.length); // a video never twice
  rows.forEach((r) => expect(new Set(r.map((v) => v.creator)).size).toBe(r.length)); // max 1 per creator per row
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, rows.length - 1); j++) {
      const a = new Set(rows[i].map((v) => v.creator));
      expect(rows[j].some((v) => a.has(v.creator))).toBe(false); // same creator not again for 3 rows
    }
  }

  await expect(page.getByTestId("back-to-top")).toBeVisible();
  await page.getByTestId("back-to-top").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});

test("tap a creator name opens their profile", async ({ page }) => {
  await page.goto("/home");
  const link = page.getByTestId("video-row").first().getByTestId("creator-link").first();
  const name = (await link.locator("span.truncate.font-semibold").textContent())!;
  await link.click();
  await expect(page).toHaveURL(/\/c\//);
  await expect(page.getByTestId("profile-name")).toHaveText(name);
});

test("Subscribed: empty until you follow, then shows that creator's posts", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("tab", { name: "Subscribed" }).click();
  await expect(page.getByTestId("subscribed-empty")).toBeVisible();
  await page.getByRole("button", { name: "Go to Discover" }).click();
  await expect(page.getByRole("tab", { name: "Discover" })).toHaveAttribute("aria-selected", "true");

  const card = page.getByTestId("creator-card").first();
  const creatorId = await card.getAttribute("data-creator");
  await card.getByRole("button", { name: "Follow" }).click();
  await expect(card.getByRole("button", { name: "Following" })).toBeVisible();

  await page.getByRole("tab", { name: "Subscribed" }).click();
  await expect(page.getByTestId("subscribed-feed")).toBeVisible();
  await expect(page.locator(`[data-testid="post"][data-creator="${creatorId}"]`).first()).toBeVisible();
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(sideways).toBe(false);

  // follows are remembered after reload (sample storage until accounts exist)
  await page.reload();
  await expect(page.getByRole("tab", { name: "Discover" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Subscribed" }).click();
  await expect(page.getByTestId("subscribed-feed")).toBeVisible();
});

test("Live now: 5 at a time, arrows move to the next 5", async ({ page }) => {
  await page.goto("/home");
  const track = page.getByTestId("live-track");
  const inView = () =>
    track.evaluate((el) => {
      const t = el.getBoundingClientRect();
      return Array.from(el.children).filter((c) => {
        const r = c.getBoundingClientRect();
        return r.left >= t.left - 1 && r.right <= t.right + 1;
      }).length;
    });
  expect(await inView()).toBe(5);
  const left = page.getByRole("button", { name: "Scroll live left" });
  const right = page.getByRole("button", { name: "Scroll live right" });
  await expect(left).toBeDisabled();
  const first = await track.locator("a").first().getAttribute("href");
  await right.click();
  await expect(left).toBeEnabled();
  await expect.poll(inView).toBe(5);
  const sixthFirst = () =>
    track.locator("a").nth(5).evaluate((el) => {
      const t = el.parentElement!.getBoundingClientRect();
      return Math.abs(el.getBoundingClientRect().left - t.left) < 2;
    });
  await expect.poll(sixthFirst).toBe(true); // the 6th ring is now first in view (waits for the smooth scroll to settle)
  await right.click();
  await expect(right).toBeDisabled(); // 12 live: 5 + 5 + last 2
  expect(first).toMatch(/^\/c\//);
});
