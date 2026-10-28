import { test } from "@playwright/test";

// Pictures of the REAL pages for the owner (rule 6: always send pictures). Only runs with SHOTS=1.
// PNGs go to D:/dev/tmp/sidelick-real-shots, then FFmpeg turns them into WebP.
const OUT = process.env.SHOTS_DIR ?? "D:/dev/tmp/sidelick-real-shots";
test.skip(!process.env.SHOTS, "set SHOTS=1 to take screenshots");

test("home screenshots", async ({ page }, info) => {
  const size = info.project.name;
  await page.goto("/home");
  await page.getByTestId("video-row").first().waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/home-discover-${size}.png` });

  await page.getByTestId("creator-card").nth(0).getByRole("button", { name: "Follow" }).click();
  await page.getByTestId("creator-card").nth(1).getByRole("button", { name: "Follow" }).click();
  await page.getByRole("tab", { name: "Subscribed" }).click();
  await page.getByTestId("subscribed-feed").waitFor();
  await page.screenshot({ path: `${OUT}/home-subscribed-${size}.png` });
});

test("register screenshots", async ({ page }, info) => {
  const size = info.project.name;
  await page.goto("/register");
  await page.screenshot({ path: `${OUT}/register-form-${size}.png`, fullPage: true });
  await page.getByLabel("Email").fill(`shot-${Date.now()}-${size}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("good password 1");
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("dialog", { name: "Check your email" }).waitFor();
  await page.screenshot({ path: `${OUT}/register-popup-${size}.png` });
});

test("login screenshots", async ({ page }, info) => {
  const size = info.project.name;
  const email = `shot-login-${Date.now()}-${size}@example.com`;
  await page.request.post("http://localhost:4000/api/auth/register", { data: { email, password: "good password 1", isAdult: true, acceptTerms: true } });
  await page.request.post("http://localhost:4000/api/auth/logout");
  await page.goto("/login");
  await page.screenshot({ path: `${OUT}/login-form-${size}.png`, fullPage: true });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByTestId("login-wrong").waitFor();
  await page.screenshot({ path: `${OUT}/login-wrong-${size}.png`, fullPage: true });
  await page.getByLabel("Password", { exact: true }).fill("good password 1");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByTestId("login-unverified").waitFor();
  await page.screenshot({ path: `${OUT}/login-unverified-${size}.png`, fullPage: true });
});
