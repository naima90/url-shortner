// Playwright config for end-to-end tests.
// These drive a real browser against the running web app, which in turn talks to
// the running API and database. Start the API (npm run dev:api) and a test
// database before running these, or wire a webServer block once your local
// setup is stable.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false, // shared database, so keep runs serial
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Starts the Next.js dev server automatically. The API is expected to be
  // running separately (it needs the test database).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
