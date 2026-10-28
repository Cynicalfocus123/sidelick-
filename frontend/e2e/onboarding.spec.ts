import { expect, test } from "@playwright/test";

// "Become a creator" steps after sign-up (F117), against the real API + database. 4 sizes.
const API = "http://localhost:4000/api";
const unique = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

test("creator steps: signed out goes to log in", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login$/);
});

test("creator steps: 6 steps, arrows, dots, centred column, Close saves 'seen' and goes Home", async ({ page }) => {
  const email = unique("intro");
  const reg = await page.request.post(`${API}/auth/register`, { data: { email, password: "good password 1", isAdult: true, acceptTerms: true } });
  expect(reg.status()).toBe(201);
  await page.goto("/onboarding");

  const step = page.getByTestId("intro-step");
  await expect(step).toHaveAttribute("aria-label", "Step 1 of 6");
  for (const slot of await page.locator('[data-slot="logo"]').all()) await expect(slot).toBeEmpty();
  const prev = page.getByRole("button", { name: "Previous step" });
  const next = page.getByRole("button", { name: "Next step" });
  await expect(prev).toBeHidden(); // hidden on step 1
  await expect(page.getByRole("button", { name: /Go to step/ })).toHaveCount(6);

  // headline under the picture, everything inside one centred column (no edge bleeding)
  const vw = page.viewportSize()!.width;
  const pic = await step.locator("span").first().boundingBox();
  const head = await step.getByRole("heading").boundingBox();
  expect(head!.y).toBeGreaterThan(pic!.y + pic!.height - 1);
  const col = await page.getByRole("main", { name: "Become a creator" }).boundingBox();
  expect(Math.abs(col!.x + col!.width / 2 - vw / 2)).toBeLessThan(2);
  expect(col!.x).toBeGreaterThanOrEqual(16);
  expect(col!.width).toBeLessThanOrEqual(560);

  for (let k = 2; k <= 6; k++) {
    await next.click();
    await expect(step).toHaveAttribute("aria-label", `Step ${k} of 6`);
  }
  await expect(step.getByRole("heading")).toHaveText("Verified fast. Earning faster");
  await expect(next).toBeHidden(); // hidden on step 6
  await prev.click();
  await expect(step).toHaveAttribute("aria-label", "Step 5 of 6");
  await page.getByRole("button", { name: "Go to step 2" }).click();
  await expect(step.getByRole("heading")).toHaveText("One platform. Built to make creators money");
  // touched = stops moving by itself
  await page.waitForTimeout(5600);
  await expect(step).toHaveAttribute("aria-label", "Step 2 of 6");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  expect(await (await page.request.get(`${API}/auth/me`)).json()).toMatchObject({ email, creatorIntroSeen: true });
});

test("creator steps: move by themselves until touched", async ({ page }) => {
  await page.request.post(`${API}/auth/register`, { data: { email: unique("intro-auto"), password: "good password 1", isAdult: true, acceptTerms: true } });
  await page.goto("/onboarding");
  const step = page.getByTestId("intro-step");
  await expect(step).toHaveAttribute("aria-label", "Step 1 of 6");
  await expect(step).toHaveAttribute("aria-label", "Step 2 of 6", { timeout: 7000 });
});

test("creator steps: 'Become a Creator' in the menu opens them", async ({ page }) => {
  await page.request.post(`${API}/auth/register`, { data: { email: unique("intro-menu"), password: "good password 1", isAdult: true, acceptTerms: true } });
  await page.goto("/home");
  const wide = page.viewportSize()!.width >= 1024;
  if (!wide) await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("link", { name: "Become a Creator" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId("intro-step")).toBeVisible();
});
