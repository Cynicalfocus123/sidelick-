// One overview picture per screen: every state (rows) x desktop / laptop / tablet / phone (columns).
// Built from wireframes/shots/*.webp, saved as WebP (FFmpeg, metadata stripped) in wireframes/sheets/.
// Usage (from frontend/): node scripts/wireframe-sheets.mjs   (run wireframes:shots first)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const wf = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "wireframes");
const out = join(wf, "sheets");
const tmp = process.env.SHOTS_TMP ?? "D:/dev/tmp/sidelick-shots";
const FFMPEG = process.env.FFMPEG ?? "D:/dev/tools/ffmpeg/bin/ffmpeg.exe";
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

const SIZES = ["desktop", "laptop", "tablet", "phone"];
const PAGES = {
  register: { title: "Register (F10) + Check your email popup (F8)", states: ["form", "errors", "popup"] },
  login: { title: "Log in /login (approved 2026-10-28)", states: ["form", "wrong", "unverified"] },
  "verify-email": { title: "Verify email /verify-email (F12)", states: ["checking", "ok", "expired-in", "expired-out", "other-device"] },
  home: { title: "Home /home - layout v3: left menu on every size, Discover tab opens first", states: ["discover", "subscribed", "subscribed-empty"] },
  onboarding: { title: "After sign-up: Become a creator, 6 steps (F117) - approved + built", states: ["1", "2", "3", "4", "5", "6"] },
  landing: { title: "Main page / (signed out) v2: header video - waiting for approval", states: ["page", "menu"] },
};
// column widths keep the real proportions between sizes
const COL = { desktop: "1.6fr", laptop: "1.3fr", tablet: "0.75fr", phone: "0.42fr" };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1000 } });
for (const [name, { title, states }] of Object.entries(PAGES)) {
  const rows = states.map((s) => `
    <div class="state">${s}</div>
    <div class="row">${SIZES.map((z) => `<figure><img src="${pathToFileURL(join(wf, "shots", `${name}-${s}-${z}.webp`)).href}"><figcaption>${z}</figcaption></figure>`).join("")}</div>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#e4e4e7;font:16px system-ui,sans-serif;color:#18181b}
    h1{margin:0 0 4px;font-size:28px} p{margin:0 0 16px;color:#52525b}
    .state{font-weight:700;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.04em;font-size:14px}
    .row{display:grid;grid-template-columns:${SIZES.map((z) => COL[z]).join(" ")};gap:16px;align-items:start}
    figure{margin:0;background:#fff;border-radius:8px;padding:6px;box-shadow:0 1px 3px rgba(0,0,0,.15)}
    img{width:100%;display:block;max-height:900px;object-fit:cover;object-position:top}
    figcaption{font-size:13px;color:#52525b;padding-top:4px}
  </style></head><body><h1>${title}</h1><p>Columns: desktop 1920 / laptop 1366 / tablet 768 / phone 390. Each colour + tag = one part of the page (colours only for this wireframe, not the site colours). Red dashed box = logo space (empty on the real site).</p>${rows}</body></html>`;
  const htmlPath = join(tmp, `sheet-${name}.html`);
  writeFileSync(htmlPath, html);
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForLoadState("load");
  const png = join(tmp, `sheet-${name}.png`);
  await page.screenshot({ path: png, fullPage: true });
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", png, "-map_metadata", "-1", "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", join(out, `${name}.webp`)]);
  console.log(`sheet: wireframes/sheets/${name}.webp`);
}
await browser.close();
