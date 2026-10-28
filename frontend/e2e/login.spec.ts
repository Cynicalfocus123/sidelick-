import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Log in (F11 / B25), against the real API + database. 4 sizes.
const API = "http://localhost:4000/api";
const unique = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const PASSWORD = "good password 1";

// Email verifying is a later step (F12), so the test marks the account verified straight in the real local database.
function markVerified(email: string) {
  const env = Object.fromEntries(
    readFileSync("../backend/.env", "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
  // psql only fills :'e' (safely quoted) in commands read from stdin, not in -c
  const out = execFileSync("D:/dev/tools/pgsql18/bin/psql.exe", ["-h", env.DB_HOST, "-p", env.DB_PORT, "-U", env.DB_USER, "-d", env.DB_NAME, "-v", "ON_ERROR_STOP=1", "-v", `e=${email}`], {
    env: { ...process.env, PGPASSWORD: env.DB_PASSWORD ?? "" },
    input: "UPDATE users SET email_verified_at = now() WHERE email = :'e';\n",
  });
  expect(out.toString()).toContain("UPDATE 1");
}

async function makeAccount(page: import("@playwright/test").Page, tag: string) {
  const email = unique(tag);
  const res = await page.request.post(`${API}/auth/register`, { data: { email, password: PASSWORD, isAdult: true, acceptTerms: true } });
  expect(res.status()).toBe(201);
  await page.request.post(`${API}/auth/logout`); // register signs in; start the test signed out
  return email;
}

test("login: layout, button waits for both fields, wrong password shows the red box", async ({ page }) => {
  const email = await makeAccount(page, "login-wrong");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  for (const slot of await page.locator('[data-slot="logo"]').all()) await expect(slot).toBeEmpty();
  await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
  const signUp = page.getByRole("link", { name: "New to Side Licks? Sign up" });
  await expect(signUp).toBeVisible();
  const [loginBox, signUpBox] = [await page.getByRole("button", { name: "Log in" }).boundingBox(), await signUp.boundingBox()];
  expect(signUpBox!.y).toBeGreaterThan(loginBox!.y); // under the Log in button
  expect(Math.abs(signUpBox!.width - loginBox!.width)).toBeLessThan(2); // same width
  const wide = page.viewportSize()!.width >= 1024;
  await expect(page.getByRole("complementary", { name: "About Side Licks" })).toBeVisible({ visible: wide });

  const login = page.getByRole("button", { name: "Log in" });
  await expect(login).toBeDisabled();
  await page.getByLabel("Email").fill(email);
  await expect(login).toBeDisabled();
  await page.getByLabel("Password", { exact: true }).fill("not the password");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await login.click();
  await expect(page.getByTestId("login-wrong")).toHaveText("Wrong email or password. Try again or reset your password.");
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get(`${API}/auth/me`)).status()).toBe(401);

  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByTestId("toast")).toContainText("Password reset comes in a later step");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await signUp.click();
  await expect(page).toHaveURL(/\/register$/);
});

test("login: email not verified yet shows the yellow box and Send it again", async ({ page }) => {
  const email = await makeAccount(page, "login-unver");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  const box = page.getByTestId("login-unverified");
  await expect(box).toContainText("Please verify your email first.");
  await expect(box).toContainText(`We sent a link to ${email}.`);
  expect((await page.request.get(`${API}/auth/me`)).status()).toBe(401); // no session until verified
  // the sign-up email was just sent, so the 1-minute wait applies (real API)
  await box.getByRole("button", { name: "Send it again" }).click();
  await expect(page.getByTestId("toast")).toContainText(/Please wait \d+ seconds before sending again/);
});

test("login: verified account + Keep me logged in goes to Home and stays signed in", async ({ page }) => {
  const email = await makeAccount(page, "login-ok");
  markVerified(email);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Keep me logged in").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("tab", { name: "Discover" })).toHaveAttribute("aria-selected", "true");
  // really signed in, with a 30-day cookie
  expect(await (await page.request.get(`${API}/auth/me`)).json()).toMatchObject({ email, emailVerified: true });
  const cookie = (await page.context().cookies()).find((c) => c.name === "sl_session")!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 86400);
});
