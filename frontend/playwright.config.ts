import { defineConfig } from "@playwright/test";

// Every test runs at the 4 sizes from design.md. Servers start for the test run and stop after.
// Needs PostgreSQL running (npm run db:start in the project root) and both apps built.
export default defineConfig({
  testDir: "e2e",
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1920, height: 1080 } } },
    { name: "laptop", use: { viewport: { width: 1366, height: 768 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "phone", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: "node dist/main.js", cwd: "../backend", url: "http://localhost:4000/api/health", reuseExistingServer: false },
    { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: false },
  ],
});
