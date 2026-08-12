import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Serial: every test resets the shared DB first, so they must not overlap.
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // The full stack (frontend + backend + db) is brought up externally via
  // docker-compose.test.yml before running the tests (see README / CI).
})
