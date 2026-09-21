import type { FieldConfig } from '@/features/form-builder/elements'
import { createImportedGoogleFormStructure } from '@/containers/dashboard/builder/[slug]/drag-model'
import { describe, expect, it } from 'vitest'

const field = (id: string): FieldConfig =>
  ({
    id,
    label: id,
    uniqueIdentifier: 'text-input',
  }) as FieldConfig

describe('createImportedGoogleFormStructure', () => {
  it('uses Google section titles verbatim and falls back to numbered pages', () => {
    const structure = createImportedGoogleFormStructure([
      { fields: [field('first')] },
      { fields: [] },
      {
        title: '  Work history  ',
        description: '  Tell us about your experience.  ',
        fields: [field('second')],
      },
    ])

    expect(structure.pages).toHaveLength(2)
    expect(structure.pages.map((page) => page.sections[0])).toMatchObject([
      { title: 'Page 1', fields: [field('first')] },
      {
        title: '  Work history  ',
        description: '  Tell us about your experience.  ',
        fields: [field('second')],
      },
    ])
  })

  it('retains named informational pages but skips entirely empty pages', () => {
    const structure = createImportedGoogleFormStructure([
      { fields: [] },
      { title: 'Read this first', description: 'Important context.', fields: [] },
      { fields: [field('question')] },
    ])

    expect(structure.pages.map((page) => page.sections[0])).toMatchObject([
      { title: 'Read this first', description: 'Important context.', fields: [] },
      { title: 'Page 2', fields: [field('question')] },
    ])
  })
})
