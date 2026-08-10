import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.CI ? undefined : "chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: browserChannel,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium", channel: browserChannel }
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 }, channel: browserChannel } }
  ],
  webServer: {
    command: "bun run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
