import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: {
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    baseURL: process.env.TRAILSAFE_TEST_URL || "http://localhost:8081",
    launchOptions: process.env.TRAILSAFE_BROWSER
      ? { executablePath: process.env.TRAILSAFE_BROWSER }
      : undefined,
    trace: "retain-on-failure",
  },
});
