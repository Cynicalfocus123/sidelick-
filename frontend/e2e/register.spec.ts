import { expect, test } from "@playwright/test";

// Register (F10) + Check your email popup (F8), against the real API + database. 4 sizes.
const API = "http://localhost:4000/api";
const unique = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

test("register: button waits for all fields, errors show, account is created and popup opens", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  for (const slot of await page.locator('[data-slot="logo"]').all()) await expect(slot).toBeEmpty();
  const create = page.getByRole("button", { name: "Create account" });
  await expect(create).toBeDisabled();

  // info panel only on laptop + desktop
  const wide = page.viewportSize()!.width >= 1024;
  await expect(page.getByRole("complementary", { name: "About Side Licks" })).toBeVisible({ visible: wide });

  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel(/I agree to the/).check();
  await expect(create).toBeEnabled();
  await create.click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Password is too short (at least 8 characters)")).toBeVisible();

  const email = unique("ui");
  await page.getByLabel("Email").fill(email.toUpperCase());
  await page.getByLabel("Password", { exact: true }).fill("good password 1");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await create.click();

  const popup = page.getByRole("dialog", { name: "Check your email" });
  await expect(popup).toBeVisible();
  await expect(popup.getByTestId("sent-to")).toHaveText(email);

  // really signed in on this device, account saved unverified
  const me = await page.request.get(`${API}/auth/me`);
  expect(me.status()).toBe(200);
  expect(await me.json()).toMatchObject({ email, emailVerified: false });

  // Send again right away = toast asks to wait (max once a minute), popup stays
  await popup.getByRole("button", { name: "Send again" }).click();
  await expect(page.getByTestId("toast")).toContainText(/Please wait \d+ seconds before sending again/);
  await expect(popup).toBeVisible();

  // Change email
  const newEmail = unique("ui-new");
  await popup.getByRole("button", { name: "Change email" }).click();
  await popup.getByLabel("New email").fill(newEmail);
  await popup.getByRole("button", { name: "Save new email" }).click();
  await expect(popup.getByTestId("sent-to")).toHaveText(newEmail);
  expect(await (await page.request.get(`${API}/auth/me`)).json()).toMatchObject({ email: newEmail });

  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(sideways).toBe(false);

  await popup.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("register: Send again after a minute closes the popup and shows 'Verification email resent'", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(unique("resend"));
  await page.getByLabel("Password", { exact: true }).fill("good password 1");
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  const popup = page.getByRole("dialog", { name: "Check your email" });
  await expect(popup).toBeVisible();
  // the real "after a minute" resend is tested against the database in backend/test/auth.e2e-spec.ts;
  // here only the screen behaviour is checked, so the API answer is stubbed
  await page.route("**/api/auth/resend-verification", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"sentTo":"x"}' }));
  await popup.getByRole("button", { name: "Send again" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByTestId("toast")).toContainText("Verification email resent");
});

test("register: an email that already has an account shows a clear message", async ({ page }) => {
  const email = unique("dup");
  const first = await page.request.post(`${API}/auth/register`, { data: { email, password: "good password 1", isAdult: true, acceptTerms: true } });
  expect(first.status()).toBe(201);

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("good password 2");
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("This email already has an account. Sign in instead.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
