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
