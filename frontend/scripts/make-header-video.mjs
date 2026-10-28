// Header video for the main page "/" (F121): tilted placeholder creator cards drifting left to right, silent, seamless 12 s loop.
// 1. Playwright draws a wide strip of neutral cards (no real photos, no logo - rule 12).
// 2. FFmpeg slides a window across one repeat of the strip, tilts it and encodes MP4 (H.264) + WebM (VP9), no audio,
//    metadata stripped, + poster frame as AVIF + WebP (rule 5).
// Run: PLAYWRIGHT_BROWSERS_PATH=D:/dev/playwright node scripts/make-header-video.mjs   (from frontend/)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const FFMPEG = "D:/dev/tools/ffmpeg/bin/ffmpeg.exe";
const TMP = "D:/dev/tmp/sidelick-header-video";
const OUT = join(import.meta.dirname, "..", "public", "media", "header");
const SECONDS = 12;
const FPS = 30;
const TILT = -0.21; // radians (about -12 degrees)

// Card + gap sizes at 1x. One repeat = COLS columns; the loop moves exactly one repeat, so the end meets the start.
const CARD_W = 250;
const CARD_H = 334;
const GAP = 34;
const COLS = 4;
const PERIOD = COLS * (CARD_W + GAP);
const TONES = [
  ["#5b6474", "#3b4250"],
  ["#7a6f74", "#4d4448"],
  ["#5f6f6a", "#3c4743"],
  ["#6e6a7d", "#45414f"],
  ["#7b746a", "#4e4942"],
  ["#5d6779", "#383f4c"],
];

function stripHtml(width, height) {
  const cols = Math.ceil(width / (CARD_W + GAP)) + 1;
  const rows = Math.ceil(height / (CARD_H + GAP)) + 2;
  let cards = "";
  for (let c = 0; c < cols; c++) {
    const k = c % COLS; // same pattern every COLS columns = seamless loop
    const shift = [-120, 40, -40, 110][k];
    for (let r = 0; r < rows; r++) {
      const [a, b] = TONES[(k * 5 + r * 2) % TONES.length];
      const x = c * (CARD_W + GAP);
      const y = r * (CARD_H + GAP) + shift - CARD_H;
      cards += `<div class="card" style="left:${x}px;top:${y}px;background:linear-gradient(160deg,${a},${b})">
        <i class="head"></i><i class="body"></i>
        <div class="chip"><i class="dot"></i><div><i class="l1"></i><i class="l2"></i></div></div></div>`;
    }
  }
  return `<!doctype html><html><head><style>
    html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:linear-gradient(150deg,#1d2430,#2b3341 60%,#252b36)}
    .card{position:absolute;width:${CARD_W}px;height:${CARD_H}px;border-radius:24px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08)}
    .head{position:absolute;left:50%;top:22%;width:38%;aspect-ratio:1;border-radius:50%;transform:translateX(-50%);background:rgba(255,255,255,.16)}
    .body{position:absolute;left:50%;top:56%;width:74%;height:40%;border-radius:48% 48% 0 0;transform:translateX(-50%);background:rgba(255,255,255,.12)}
    .chip{position:absolute;left:12px;right:12px;bottom:12px;height:46px;border-radius:14px;background:rgba(15,18,24,.55);display:flex;align-items:center;gap:10px;padding:0 10px}
    .dot{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.55);flex-shrink:0}
    .chip div{display:grid;gap:6px;flex:1}
    .l1,.l2{display:block;height:7px;border-radius:4px;background:rgba(255,255,255,.6);width:70%}
    .l2{width:44%;background:rgba(255,255,255,.3)}
  </style></head><body>${cards}</body></html>`;
}

// Window size the tilted output needs so the corners stay covered.
const need = (w, h) => [Math.ceil(w * Math.cos(TILT) + h * Math.abs(Math.sin(TILT))) + 8, Math.ceil(w * Math.abs(Math.sin(TILT)) + h * Math.cos(TILT)) + 8];

const ff = (args) => execFileSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });

// name, output size, card scale (phone shows bigger cards)
const VARIANTS = [
  { name: "landscape-1920", w: 1920, h: 1080, scale: 1 },
  { name: "landscape-1280", w: 1280, h: 720, scale: 2 / 3 },
  { name: "portrait-720", w: 720, h: 1280, scale: 0.85 },
];

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const v of VARIANTS) {
  const [winW, winH] = need(v.w, v.h).map((n) => Math.ceil(n / v.scale));
  const stripW = winW + PERIOD + CARD_W;
  const page = await browser.newPage({ viewport: { width: stripW, height: winH }, deviceScaleFactor: v.scale });
  await page.setContent(stripHtml(stripW, winH));
  const png = join(TMP, `${v.name}-strip.png`);
  await page.screenshot({ path: png });
  await page.close();

  const [cw, ch] = need(v.w, v.h);
  const p = Math.round(PERIOD * v.scale);
  // x goes from one repeat to 0 = the cards move right; then tilt and cut the centre to the output size.
  const vf = [
    `crop=${cw}:${ch}:'${p}-${p}*t/${SECONDS}':0`,
    `rotate=${TILT}:ow=${v.w}:oh=${v.h}:c=#1d2430`,
    "format=yuv420p",
  ].join(",");
  const input = ["-loop", "1", "-framerate", String(FPS), "-t", String(SECONDS), "-i", png];
  const base = join(OUT, v.name);
  ff([...input, "-vf", vf, "-an", "-map_metadata", "-1", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-movflags", "+faststart", `${base}.mp4`]);
  ff([...input, "-vf", vf, "-an", "-map_metadata", "-1", "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", `${base}.webm`]);
  // poster = the first frame (same as where the loop starts)
  ff(["-i", `${base}.mp4`, "-frames:v", "1", "-map_metadata", "-1", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "34", `${base}.avif`]);
  ff(["-i", `${base}.mp4`, "-frames:v", "1", "-map_metadata", "-1", "-c:v", "libwebp", "-quality", "78", `${base}.webp`]);
  console.log("made", v.name);
}
await browser.close();
