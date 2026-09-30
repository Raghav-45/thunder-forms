import { expect, test } from '@playwright/test'

test('section metadata is saved from its editor', async ({ page }) => {
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Section Add' }).click()
  await page.getByText('Section 1', { exact: true }).hover()
  await page
    .getByRole('button', { name: 'Edit Section 1', exact: true })
    .click()

  const editor = page.getByRole('dialog')
  await editor.getByLabel('Title').fill('About you')
  await editor.getByLabel('Description').fill('Tell us about yourself.')
  await editor.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('About you', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Tell us about yourself.', { exact: true }),
  ).toBeVisible()
})

test('section removal deletes the section from the canvas', async ({ page }) => {
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Section Add' }).click()
  await page.getByText('Section 1', { exact: true }).hover()
  await page
    .getByRole('button', { name: 'Remove Section 1', exact: true })
    .click()

  await expect(
    page.getByText('Drag elements here to build your form or Generate with AI'),
  ).toBeVisible()
})

test('hovering a section does not reveal nested field controls', async ({ page }) => {
  await page.goto('/dashboard/builder/new-form', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Section Add' }).click()
  await page.getByRole('button', { name: 'text-input', exact: true }).click()

  const editField = page.getByRole('button', {
    name: 'Edit Your Name',
    exact: true,
  })
  const fieldControls = editField.locator('..')
  await page.getByText('Section 1', { exact: true }).hover()
  await expect(fieldControls).toHaveCSS('opacity', '0')

  await page.getByText('Your Name', { exact: true }).hover()
  await expect(fieldControls).toHaveCSS('opacity', '1')
})
