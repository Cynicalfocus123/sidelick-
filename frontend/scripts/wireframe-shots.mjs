// Screenshots every wireframe state at the 4 screen sizes, then FFmpeg -> WebP
// (metadata stripped) into wireframes/shots/. Also fails if any page scrolls sideways.
// Usage (from frontend/): node scripts/wireframe-shots.mjs
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const wf = join(root, "wireframes");
const out = join(wf, "shots");
const tmp = process.env.SHOTS_TMP ?? "D:/dev/tmp/sidelick-shots";
const FFMPEG = process.env.FFMPEG ?? "D:/dev/tools/ffmpeg/bin/ffmpeg.exe";
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

export const SIZES = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  phone: { width: 390, height: 844 },
};
const PAGES = {
  register: ["form", "errors", "popup"],
  "verify-email": ["checking", "ok", "expired-in", "expired-out", "other-device"],
  home: ["feed", "empty"],
};

const browser = await chromium.launch();
const problems = [];
for (const [size, viewport] of Object.entries(SIZES)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: size === "phone", hasTouch: size === "phone" || size === "tablet" });
  const page = await ctx.newPage();
  for (const [name, states] of Object.entries(PAGES)) {
    for (const state of states) {
      const url = `${pathToFileURL(join(wf, `${name}.html`)).href}?state=${state}&shot`;
      await page.goto(url);
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (sideways) problems.push(`${name} ${state} @${size}: sideways scroll`);
      const png = join(tmp, `${name}-${state}-${size}.png`);
      await page.screenshot({ path: png, fullPage: true });
      const webp = join(out, `${name}-${state}-${size}.webp`);
      execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", png, "-map_metadata", "-1", "-c:v", "libwebp", "-quality", "85", "-compression_level", "6", webp]);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join("\n")}` : "All wireframes: no sideways scroll at any size.");
process.exit(problems.length ? 1 : 0);
