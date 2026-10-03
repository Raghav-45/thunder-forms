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

test('customization changes only the active tab background and preserves its shape', async ({ page }, testInfo) => {
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })
  const nav = page.getByRole('navigation', { name: 'Form pages' })
  await nav.getByRole('button', { name: 'Add page', exact: true }).click()
  const chromeAppearance = () => nav.evaluate((nav) => {
    const surface = nav.querySelector('[data-active-page-tab-surface]')!
    const addButton = nav.querySelector('[data-add-page]')!
    const surfaceStyle = getComputedStyle(surface)
    const navStyle = getComputedStyle(nav)
    const addStyle = getComputedStyle(addButton)
    const before = getComputedStyle(surface, '::before')
    const after = getComputedStyle(surface, '::after')
    return {
      railBackground: navStyle.backgroundColor,
      font: navStyle.fontFamily,
      letterSpacing: navStyle.letterSpacing,
      tabHeight: surfaceStyle.height,
      tabWidth: surfaceStyle.width,
      topLeftRadius: surfaceStyle.borderTopLeftRadius,
      topRightRadius: surfaceStyle.borderTopRightRadius,
      leftCurve: [before.width, before.height],
      rightCurve: [after.width, after.height],
      addButton: [addStyle.backgroundColor, addStyle.color, addStyle.width, addStyle.height],
    }
  })
  const originalChrome = await chromeAppearance()
  const originalBackground = await nav.locator('[data-active-page-tab-surface]').evaluate(
    (surface) => getComputedStyle(surface).backgroundColor,
  )
  await page.getByRole('button', { name: 'Customize', exact: true }).click()
  const editor = page.getByTestId('builder-left-sidebar')
  await editor.getByRole('button', { name: 'Advanced customizations', exact: true }).click()
  await editor.getByRole('button', { name: 'Import or export a theme', exact: true }).click()
  await editor.getByRole('textbox', { name: 'Theme code', exact: true }).fill(
    ':root { --background: #28465c; --card: #897459; --muted: #ddeeff; --spacing: 0.75rem; --radius: 0rem; --font-sans: Georgia, serif; --tracking-normal: 0.1em; }',
  )
  await editor.getByRole('button', { name: 'Import theme', exact: true }).click()
  await editor.getByRole('button', { name: 'Apply changes', exact: true }).click()
  await expect.poll(chromeAppearance).toEqual(originalChrome)
  const activeSurface = nav.locator('[data-active-page-tab-surface]')
  await expect(activeSurface).toHaveCSS('background-color', 'rgb(40, 70, 92)')
  await expect(page.locator('[data-form-theme]')).toHaveCSS('background-color', 'rgb(40, 70, 92)')
  for (const pseudo of ['::before', '::after']) {
    await expect.poll(() => activeSurface.evaluate(
      (surface, pseudo) => getComputedStyle(surface, pseudo).backgroundImage,
      pseudo,
    )).toContain('rgb(40, 70, 92)')
  }
  await nav.getByRole('button', { name: 'Page 1', exact: true }).click()
  await expect(nav.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(activeSurface).toHaveCSS('background-color', 'rgb(40, 70, 92)')
  await expect.poll(chromeAppearance).toEqual(originalChrome)
  await testInfo.attach('customized-page-tabs', { body: await nav.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
  await page.getByRole('button', { name: 'Customize', exact: true }).click()
  await editor.getByRole('button', { name: 'Reset to original', exact: true }).click()
  await expect.poll(chromeAppearance).toEqual(originalChrome)
  await expect(activeSurface).toHaveCSS('background-color', originalBackground)
})

test('page tabs scroll without widening the builder', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })

  const addPage = page.getByRole('button', { name: 'Add page' })
  for (let index = 0; index < 6; index += 1) {
    await addPage.click()
  }

  const measurements = await page
    .getByRole('navigation', { name: 'Form pages' })
    .evaluate((nav) => {
      const active = nav.querySelector('[data-active]')
      const addPage = nav.querySelector('[data-add-page]')
      const navRect = nav.getBoundingClientRect()
      const activeRect = active?.getBoundingClientRect()
      const addPageRect = addPage?.getBoundingClientRect()

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        navWidth: nav.clientWidth,
        navScrollWidth: nav.scrollWidth,
        addPageRightGap: addPageRect
          ? navRect.right - addPageRect.right
          : 0,
        activeVisible: Boolean(
          activeRect &&
            activeRect.left >= navRect.left &&
            activeRect.right <= navRect.right,
        ),
        addPageVisible: Boolean(
          addPageRect &&
            addPageRect.left >= navRect.left &&
            addPageRect.right <= navRect.right,
        ),
      }
    })

  expect(measurements.documentWidth).toBe(measurements.viewportWidth)
  expect(measurements.navScrollWidth).toBeGreaterThan(measurements.navWidth)
  expect(measurements.activeVisible).toBe(true)
  expect(measurements.addPageVisible).toBe(true)
  expect(measurements.addPageRightGap).toBeGreaterThanOrEqual(16)
})
