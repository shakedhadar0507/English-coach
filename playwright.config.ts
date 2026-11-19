import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a running server (BASE_URL, default http://localhost:3100)
 * backed by a disposable database with a seeded owner (E2E_EMAIL / E2E_PASSWORD).
 * See docs/TESTING.md.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3100", trace: "off", locale: "he-IL" },
  projects: [{ name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
});
