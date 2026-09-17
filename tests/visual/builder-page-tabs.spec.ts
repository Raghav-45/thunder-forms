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

test('page tabs scroll without widening the builder', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(
    new URL(
      '/dashboard/builder/new-form',
      process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    ).toString(),
    { waitUntil: 'networkidle' },
  )

  const addPage = page.getByRole('button', { name: 'Add page' })
  for (let index = 0; index < 6; index += 1) {
    await addPage.click()
  }

  const measurements = await page
    .getByRole('navigation', { name: 'Form pages' })
    .evaluate((nav) => {
      const active = nav.querySelector('[data-active]')
      const navRect = nav.getBoundingClientRect()
      const activeRect = active?.getBoundingClientRect()

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        navWidth: nav.clientWidth,
        navScrollWidth: nav.scrollWidth,
        activeVisible: Boolean(
          activeRect &&
            activeRect.left >= navRect.left &&
            activeRect.right <= navRect.right,
        ),
      }
    })

  expect(measurements.documentWidth).toBe(measurements.viewportWidth)
  expect(measurements.navScrollWidth).toBeGreaterThan(measurements.navWidth)
  expect(measurements.activeVisible).toBe(true)
})
