import { defineConfig, devices } from "@playwright/test";

// Smoke tests for the three user flows (SPEC §10), against the dev server and a freshly
// seeded LOCAL database. The flows share that database and run in file order — 1 buyer,
// 2 seller, 3 manager (who suspends the seller) — so there is one worker and no retries: a
// retry would start from data the first attempt already changed.

const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  // The dev server compiles each route on its first request, so the first visits are slow.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 45_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
