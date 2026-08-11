import { expect, test } from '@playwright/test'

test('app loads and shows the nav', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('LinkPulse')
  // The nav link, specifically (there's also a "Bookmarks" page heading).
  await expect(page.getByRole('link', { name: 'Bookmarks' })).toBeVisible()
})
