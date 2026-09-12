import type { FieldConfig } from '@/features/form-builder/elements'
import {
  createFormStructure,
  getOrderedFormFields,
  isFormStructure,
  type FormStructure,
} from '@/features/form-builder/form-structure'
import { describe, expect, it } from 'vitest'

const field = (id: string): FieldConfig =>
  ({
    id,
    label: id,
    uniqueIdentifier: 'text-input',
  }) as FieldConfig

const structure = (pages: FormStructure['pages']): FormStructure => ({ pages })

describe('form structure', () => {
  it('creates one page and one section for imported fields', () => {
    const ids = ['section-id', 'page-id']
    const form = createFormStructure([field('field-id')], () => ids.shift()!)

    expect(form).toEqual({
      pages: [
        {
          id: 'page-id',
          sections: [{ id: 'section-id', fields: [field('field-id')] }],
        },
      ],
    })
  })

  it('accepts a canonical multi-page tree and preserves authoring order', () => {
    const form = structure([
      {
        id: 'page-a',
        sections: [
          { id: 'section-a', fields: [field('field-a'), field('field-b')] },
          { id: 'section-b', fields: [field('field-c')] },
        ],
      },
      {
        id: 'page-b',
        sections: [{ id: 'section-c', fields: [field('field-d')] }],
      },
    ])

    expect(isFormStructure(form)).toBe(true)
    expect(getOrderedFormFields(form).map((item) => item.id)).toEqual([
      'field-a',
      'field-b',
      'field-c',
      'field-d',
    ])
  })

  it('rejects an empty page list before builder state can dereference it', () => {
    expect(isFormStructure({ pages: [] })).toBe(false)
  })

  it('rejects malformed, duplicate, and unknown field identities', () => {
    expect(
      isFormStructure({
        pages: [{ id: 'page', sections: [{ id: 'section', fields: [] }] }],
      }),
    ).toBe(true)

    expect(
      isFormStructure({
        pages: [
          { id: 'page', sections: [] },
          { id: 'page', sections: [] },
        ],
      }),
    ).toBe(false)

    expect(
      isFormStructure({
        pages: [
          {
            id: 'page',
            sections: [
              {
                id: 'section',
                fields: [{ ...field('field'), uniqueIdentifier: 'unknown' }],
              },
            ],
          },
        ],
      }),
    ).toBe(false)

    expect(
      isFormStructure({
        pages: [{ id: 'page', sections: [{ id: 'section', fields: ['field'] }] }],
      }),
    ).toBe(false)
  })

  it('rejects missing collections and every kind of duplicate identifier', () => {
    expect(isFormStructure(null)).toBe(false)
    expect(isFormStructure({ pages: 'not-an-array' })).toBe(false)
    expect(
      isFormStructure({ pages: [{ id: 'page', sections: 'not-an-array' }] }),
    ).toBe(false)
    expect(
      isFormStructure({
        pages: [{ id: 'page', sections: [{ id: 'section', fields: 'not-an-array' }] }],
      }),
    ).toBe(false)

    expect(
      isFormStructure({
        pages: [
          {
            id: 'page',
            sections: [
              { id: 'section', fields: [field('field'), field('field')] },
            ],
          },
        ],
      }),
    ).toBe(false)
    expect(
      isFormStructure({
        pages: [{ id: 'page', sections: [{ id: 'page', fields: [] }] }],
      }),
    ).toBe(false)
  })
})
