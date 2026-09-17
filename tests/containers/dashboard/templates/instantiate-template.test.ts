import {
  countTemplateFields,
  FORM_TEMPLATES,
  getTemplateBySlug,
} from '@/containers/dashboard/templates/constants'
import { instantiateTemplate } from '@/containers/dashboard/templates/instantiate-template'
import { isFormStructure } from '@/features/form-builder/form-structure'
import type { FormTemplateSpec } from '@/containers/dashboard/templates/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const allIds = (template: ReturnType<typeof instantiateTemplate>) => [
  ...template.pages.map((page) => page.id),
  ...template.pages.flatMap((page) => page.sections.map((section) => section.id)),
  ...template.pages.flatMap((page) =>
    page.sections.flatMap((section) => section.fields.map((field) => field.id)),
  ),
]

describe('template catalog', () => {
  it.each(FORM_TEMPLATES)('finds %s by slug', (template) => {
    expect(getTemplateBySlug(template.slug)).toBe(template)
  })

  it('returns undefined for an unknown template slug', () => {
    expect(getTemplateBySlug('missing-template')).toBeUndefined()
  })

  it.each(FORM_TEMPLATES)('counts fields in %s', (template) => {
    const expectedCount = template.sections.flatMap((section) => section.fields).length

    expect(countTemplateFields(template)).toBe(expectedCount)
  })
})

describe('instantiateTemplate', () => {
  beforeEach(() => {
    let nextId = 0
    vi.stubGlobal('crypto', {
      randomUUID: () => `${String(nextId++).padStart(8, '0')}-uuid`,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(FORM_TEMPLATES)('creates valid form structure for %s', (template) => {
    expect(isFormStructure(instantiateTemplate(template))).toBe(true)
  })

  it('assigns unique ids to two instances of same template', () => {
    const template = FORM_TEMPLATES[0]
    const first = instantiateTemplate(template)
    const second = instantiateTemplate(template)

    expect(new Set(allIds(first)).size).toBe(allIds(first).length)
    expect(new Set(allIds(second)).size).toBe(allIds(second).length)
    expect(allIds(first).some((id) => allIds(second).includes(id))).toBe(false)
  })

  it('preserves presentation overrides allowed by template spec', () => {
    const template: FormTemplateSpec = {
      slug: 'test-template',
      title: 'Test template',
      description: 'Description',
      category: 'Test',
      sections: [
        {
          fields: [
            {
              type: 'single-select',
              label: 'Priority',
              placeholder: 'Choose priority',
              description: 'Pick one',
              required: true,
              options: [{ label: 'High', value: 'high' }],
            },
          ],
        },
      ],
    }

    const field = instantiateTemplate(template).pages[0].sections[0].fields[0]

    expect(field).toMatchObject({
      uniqueIdentifier: 'single-select',
      label: 'Priority',
      placeholder: 'Choose priority',
      description: 'Pick one',
      required: true,
      options: [{ label: 'High', value: 'high' }],
    })
  })
})
