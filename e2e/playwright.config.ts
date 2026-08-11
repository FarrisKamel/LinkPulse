import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Fail the CI run if a test.only is committed by accident.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // Playwright starts the frontend dev server itself, waits for it, then runs
  // the tests. LP-14 will replace this with the full docker-compose.test.yml
  // stack once E2E flows need the API. For the smoke test, the frontend alone
  // is enough (the pages are static placeholders).
  webServer: {
    command: 'npm --prefix ../frontend run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
