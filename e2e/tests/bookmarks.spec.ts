import { expect, test } from './fixtures'

test('add a bookmark via the UI', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add Bookmark' }).click()
  await page.getByPlaceholder('https://example.com').fill('https://alpha.test')
  await page.getByRole('button', { name: 'Fetch' }).click()

  // Stub metadata previews as "Site: <host>".
  await expect(page.getByText('Site: alpha.test')).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()

  // The new card appears in the grid.
  await expect(
    page.getByRole('button', { name: /alpha\.test/ }),
  ).toBeVisible()
})

test('edit a bookmark note persists after reload', async ({ page, seed }) => {
  await seed('https://beta.test')
  await page.goto('/')

  await page.getByRole('button', { name: /beta\.test/ }).click()
  await page.getByPlaceholder(/Add a note/).fill('my note')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.reload()
  await page.getByRole('button', { name: /beta\.test/ }).click()
  await expect(page.getByPlaceholder(/Add a note/)).toHaveValue('my note')
})

test('delete a bookmark removes it from the list', async ({ page, seed }) => {
  await seed('https://gamma.test')
  await page.goto('/')

  await page.getByRole('button', { name: /gamma\.test/ }).click()
  await page.getByRole('button', { name: 'Delete bookmark' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  await expect(page.getByText('No bookmarks yet')).toBeVisible()
})

test('search narrows the list', async ({ page, seed }) => {
  await seed('https://apple.test')
  await seed('https://banana.test')
  await page.goto('/')

  await page.getByPlaceholder(/Search bookmarks/).fill('apple')

  await expect(page.getByRole('button', { name: /apple\.test/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /banana\.test/ })).toHaveCount(0)
})
