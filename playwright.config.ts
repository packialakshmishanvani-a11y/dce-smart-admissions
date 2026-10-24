import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// The E2E run starts the production server with no GEMINI_API_KEY or
// MAKE_WEBHOOK_URL, so the chatbot answers in its deterministic FAQ-only
// mode and no paid or external calls are made.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Optional: point at an existing Chromium instead of `npx playwright install chromium`.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ["--no-sandbox"] }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { GEMINI_API_KEY: "", MAKE_WEBHOOK_URL: "" },
  },
});
