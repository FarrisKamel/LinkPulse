import { expect, test } from './fixtures'

test('create, rename, and delete a tag', async ({ page }) => {
  await page.goto('/tags')

  // Create
  await page.getByPlaceholder('New tag name').fill('e2e-tag')
  await page.getByRole('button', { name: 'Add tag' }).click()
  await expect(page.getByText('e2e-tag')).toBeVisible()

  // Rename
  await page.getByRole('button', { name: 'Rename' }).click()
  await page.getByLabel('Tag name').fill('e2e-renamed')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('e2e-renamed')).toBeVisible()

  // Delete (with confirmation)
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Yes' }).click()
  await expect(page.getByText('e2e-renamed')).toHaveCount(0)
})
