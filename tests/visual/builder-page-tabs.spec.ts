import { expect, test } from '@playwright/test'

test('page tabs retain the Chrome tab-strip treatment', async ({ page }) => {
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })

  const addPage = page.getByRole('button', { name: 'Add page' })
  await addPage.click()
  await addPage.click()
  await page.getByRole('button', { name: 'Page 1', exact: true }).click()

  await expect(page.getByRole('navigation', { name: 'Form pages' })).toHaveScreenshot(
    'builder-page-tabs-chrome.png',
    { animations: 'disabled' },
  )
})
