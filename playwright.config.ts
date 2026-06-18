import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  `pnpm dev --hostname localhost --port ${port}`;
const webServerEnv: Record<string, string> = {};

for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined) {
    webServerEnv[key] = value;
  }
}

webServerEnv.NEXT_TELEMETRY_DISABLED = "1";
webServerEnv.WATCHPACK_POLLING = "true";
webServerEnv.AUTH_SECRET ??= "playwright-test-secret";
webServerEnv.AUTH_URL ??= baseURL;
webServerEnv.NEXTAUTH_URL ??= baseURL;

if (!process.env.PLAYWRIGHT_WEB_SERVER_COMMAND) {
  webServerEnv.NEXT_DIST_DIR ??= ".next-e2e";
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: webServerCommand,
        env: webServerEnv,
        url: `${baseURL}/favicon.ico`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
