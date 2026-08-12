import { test as base, expect } from '@playwright/test'

type SeedFn = (url: string, tags?: string[]) => Promise<void>

/**
 * Extended test with a clean database before each test and a `seed` helper
 * that creates bookmarks via the API. The backend runs with FAKE_METADATA=1
 * (deterministic stub metadata) and TESTING=1 (the /api/_test/reset endpoint).
 */
export const test = base.extend<{ resetDb: void; seed: SeedFn }>({
  resetDb: [
    async ({ request }, use) => {
      const resp = await request.post('/api/_test/reset')
      expect(resp.ok()).toBeTruthy()
      await use()
    },
    { auto: true },
  ],
  seed: async ({ request }, use) => {
    const seed: SeedFn = async (url, tags = []) => {
      const resp = await request.post('/api/bookmarks', { data: { url, tags } })
      expect(resp.ok()).toBeTruthy()
    }
    await use(seed)
  },
})

export { expect }
