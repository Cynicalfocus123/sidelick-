import { expect, test, type Page } from "@playwright/test";

// Step 1C main page "/" for signed-out visitors (F121). Runs at desktop / laptop / tablet / phone, against the real API + database.
const API = "http://localhost:4000/api";
const unique = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

const size = (page: Page) => {
  const w = page.viewportSize()!.width;
  return w >= 1440 ? "desktop" : w >= 1024 ? "laptop" : w >= 640 ? "tablet" : "phone";
};
const HEIGHT = { desktop: 0.8, laptop: 0.8, tablet: 0.62, phone: 0.88 };
const PADDING = { desktop: 80, laptop: 48, tablet: 32, phone: 16 };
const VIDEO = { desktop: "landscape-1920", laptop: "landscape-1280", tablet: "landscape-1280", phone: "portrait-720" };

test("header video: full width, right height, plays silently in a loop; empty logo space; no sideways scroll", async ({ page }) => {
  await page.goto("/");
  const s = size(page);
  const { width, height } = page.viewportSize()!;
  const band = (await page.getByTestId("header-video-band").boundingBox())!;
  expect(band.x).toBe(0);
  expect(band.width).toBe(width);
  expect(Math.abs(band.height - height * HEIGHT[s])).toBeLessThan(2);

  await expect(page.getByTestId("header-poster")).toBeVisible();
  const video = page.getByTestId("header-video");
  await expect(video).toHaveCount(1);
  expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, autoplay: v.autoplay }))).toEqual({ muted: true, loop: true, autoplay: true });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc)).toContain(`/media/header/${VIDEO[s]}.`);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 }).toBeGreaterThan(0.2);
  const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);
  expect(duration).toBeGreaterThanOrEqual(8);
  expect(duration).toBeLessThanOrEqual(12.1);

  // Rule 12: no logo. The slot exists and is empty.
  const slot = page.locator('[data-slot="logo"]');
  await expect(slot).toBeVisible();
  await expect(slot).toBeEmpty();

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("reduced motion: poster only, no video", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("header-poster")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("header-video")).toHaveCount(0);
});

test("menu on the video: what shows at each size; links not built yet show a toast", async ({ page }) => {
  await page.goto("/");
  const s = size(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  const login = nav.getByRole("link", { name: "Login" });
  const signup = nav.getByRole("link", { name: "Signup" });
  const menuButton = nav.getByRole("button", { name: "Open menu" });
  const wide = s === "desktop" || s === "laptop";

  await expect(nav.getByRole("button", { name: "Features" })).toBeVisible({ visible: wide });
  await expect(login).toBeVisible({ visible: s !== "phone" });
  await expect(signup).toBeVisible({ visible: s !== "phone" });
  await expect(menuButton).toBeVisible({ visible: !wide });
  if (s !== "phone") {
    await expect(login).toHaveAttribute("href", "/login");
    await expect(signup).toHaveAttribute("href", "/register");
  }

  if (wide) {
    for (const l of ["Features", "Partnership", "About", "Blog"]) await expect(nav.getByRole("button", { name: l })).toBeVisible();
    await nav.getByRole("button", { name: "Partnership" }).click();
    await expect(page.getByText("Partnership comes in a later step")).toBeVisible();
    return;
  }

  // phone + tablet: the menu slides in from the right
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeHidden();
  await menuButton.click();
  await expect(drawer).toBeVisible();
  await expect.poll(async () => Math.round((await drawer.boundingBox())!.x + (await drawer.boundingBox())!.width)).toBe(page.viewportSize()!.width);
  for (const l of ["Features", "Partnership", "About", "Blog"]) await expect(drawer.getByRole("button", { name: l })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Login" })).toBeVisible({ visible: s === "phone" });
  await expect(drawer.getByRole("link", { name: "Signup" })).toBeVisible({ visible: s === "phone" });
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await menuButton.click();
  await drawer.getByRole("button", { name: "Blog" }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByText("Blog comes in a later step")).toBeVisible();
  if (s === "phone") {
    await menuButton.click();
    await drawer.getByRole("link", { name: "Signup" }).click();
    await expect(page).toHaveURL(/\/register$/);
  }
});

test("sections: full width with the right side padding; hero pictures next to / under the text", async ({ page }) => {
  await page.goto("/");
  const s = size(page);
  const width = page.viewportSize()!.width;
  for (const id of ["hero", "popular", "how", "for-creators"]) {
    const el = page.getByTestId(id);
    const box = (await el.boundingBox())!;
    expect(box.x, id).toBe(0);
    expect(box.width, id).toBe(width);
    expect(await el.evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft)), id).toBe(PADDING[s]);
  }
  const footer = page.getByRole("contentinfo");
  expect((await footer.boundingBox())!.width).toBe(width);

  const hero = page.getByTestId("hero");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Get closer to the creators you love");
  await expect(hero.getByRole("link", { name: "Sign up free" })).toHaveAttribute("href", "/register");
  await expect(hero.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  await expect(hero.getByText("18+ only. Free to join.")).toBeVisible();

  const text = (await page.getByTestId("hero-text").boundingBox())!;
  const tiles = page.getByTestId("hero-tile");
  const visible = [];
  for (const t of await tiles.all()) if (await t.isVisible()) visible.push((await t.boundingBox())!);
  expect(visible.length).toBe(s === "phone" ? 3 : 4);
  for (const b of visible) expect(Math.abs(b.y - visible[0].y)).toBeLessThan(1); // one row
  if (s === "desktop" || s === "laptop") {
    expect(visible[0].x).toBeGreaterThan(text.x + text.width); // right of the text
    expect(visible[0].x - (text.x + text.width)).toBeLessThan(80); // right next to it, no big gap
  } else {
    expect(visible[0].y).toBeGreaterThan(text.y + text.height); // under the text
  }

  await expect(page.getByTestId("how").getByRole("listitem")).toHaveText([/Follow for free/, /Subscribe or unlock/, /Chat and tip/]);
  const band = page.getByTestId("for-creators");
  await expect(band.getByRole("heading", { name: "Are you a creator?" })).toBeVisible();
  await expect(band.getByRole("link", { name: "Become a creator" })).toHaveAttribute("href", "/register");
  await expect(band.getByRole("listitem")).toHaveCount(3);
  expect(await band.textContent()).not.toMatch(/\d/); // no numbers

  for (const l of ["Terms", "Privacy", "Acceptable Use", "Help", "Contact"]) await expect(footer.getByRole("button", { name: l })).toBeVisible();
  await expect(footer.getByText("18+ only")).toBeVisible();
  await footer.getByRole("button", { name: "Privacy" }).click();
  await expect(page.getByText("Privacy comes in a later step")).toBeVisible();
});

test("popular creators: View profile opens the profile; follow / subscribe / message signed out = sign-up popup", async ({ page }) => {
  await page.goto("/");
  const cards = page.getByTestId("popular-card");
  expect(await cards.count()).toBeGreaterThanOrEqual(6);
  const first = cards.first();
  const name = (await first.getByRole("heading").textContent())!;
  await first.getByRole("link", { name: "View profile" }).click();
  await expect(page).toHaveURL(/\/c\/[a-z0-9]+$/);
  await expect(page.getByTestId("profile-name")).toHaveText(name);

  const popup = page.getByRole("dialog", { name: "Sign up to continue" });
  for (const [button, title] of [["Follow", `Sign up to follow ${name}`], ["Subscribe", `Sign up to subscribe to ${name}`], ["Message", `Sign up to message ${name}`]]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(popup.getByRole("heading")).toHaveText(title);
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
  }
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await popup.getByRole("link", { name: "Sign up free" }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test("routing: signed in at / goes to /home, signed out at /home goes to /, old cookie stays on /", async ({ page, context }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.getByTestId("hero")).toBeVisible();

  // a cookie the server does not know = signed out (no redirect loop)
  await context.addCookies([{ name: "sl_session", value: "not-a-real-session", domain: "localhost", path: "/" }]);
  await page.goto("/");
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await page.goto("/home");
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await context.clearCookies();

  // real account in the real database: the session row makes "/" go to /home
  const email = unique("landing-route");
  const res = await page.request.post(`${API}/auth/register`, { data: { email, password: "good password 1", isAdult: true, acceptTerms: true } });
  expect(res.status()).toBe(201);
  const me = await page.request.get(`${API}/auth/me`);
  expect((await me.json()).email).toBe(email);
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByTestId("side-menu")).toBeVisible();

  // signed in: profile buttons do not open the sign-up popup
  await page.goto("/c/" + (await page.getByTestId("creator-link").first().getAttribute("href"))!.split("/").pop());
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByText("Follow comes in a later step")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Sign up to continue" })).toHaveCount(0);

  // log out: the session is gone from the database, so /home goes back to "/"
  expect((await page.request.post(`${API}/auth/logout`)).status()).toBe(204);
  expect((await page.request.get(`${API}/auth/me`)).status()).toBe(401);
  await page.goto("/home");
  await expect(page).toHaveURL(/localhost:3000\/$/);
});
