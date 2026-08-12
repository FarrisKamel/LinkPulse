import { expect, test } from './fixtures'

test('dashboard renders stats and charts for seeded data', async ({
  page,
  seed,
}) => {
  await seed('https://react.dev', ['frontend'])
  await seed('https://python.org', ['backend'])

  await page.goto('/dashboard')

  // Stat tiles.
  await expect(page.getByText('Total bookmarks')).toBeVisible()
  await expect(page.getByText('Added this week')).toBeVisible()

  // Chart cards.
  await expect(page.getByText('Top domains')).toBeVisible()
  await expect(
    page.getByText('Bookmarks over time (30 days)'),
  ).toBeVisible()
  await expect(page.getByText('Tag distribution')).toBeVisible()

  // A seeded domain shows up in the bar chart axis.
  await expect(page.getByText('react.dev')).toBeVisible()
})
