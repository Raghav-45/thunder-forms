import type { FieldConfig } from '@/features/form-builder/elements'
import {
  createFormStructure,
  getOrderedFormFields,
  isFormStructure,
  sanitizeImportedFields,
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

  it('accepts optional section titles and descriptions', () => {
    expect(
      isFormStructure({
        pages: [
          {
            id: 'page',
            sections: [
              {
                id: 'section',
                title: 'About you',
                description: 'Tell us about yourself.',
                fields: [field('field')],
              },
            ],
          },
        ],
      }),
    ).toBe(true)
  })

  it('accepts registered file-upload fields', () => {
    expect(
      isFormStructure({
        pages: [{
          id: 'page',
          sections: [{
            id: 'section',
            fields: [{
              id: 'portfolio',
              label: 'Portfolio',
              uniqueIdentifier: 'file-upload',
            }],
          }],
        }],
      }),
    ).toBe(true)
  })

  it('rejects section metadata that is not text', () => {
    expect(
      isFormStructure({
        pages: [
          {
            id: 'page',
            sections: [{ id: 'section', title: 1, fields: [] }],
          },
        ],
      }),
    ).toBe(false)
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

describe('sanitizeImportedFields', () => {
  it('drops unknown types and repairs missing or duplicate ids', () => {
    const result = sanitizeImportedFields([
      field('keep'),
      { ...field('keep'), label: 'duplicate id' },
      { ...field(''), label: 'missing id' },
      { id: 'bad', label: 'bad', uniqueIdentifier: 'unknown' },
      'not-an-object',
      null,
    ])

    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('keep')
    expect(new Set(result.map((item) => item.id)).size).toBe(3)
    expect(
      result.every((item) =>
        isFormStructure({
          pages: [{ id: 'page', sections: [{ id: 'section', fields: [item] }] }],
        }),
      ),
    ).toBe(true)
  })

  it('returns an empty list for non-array payloads', () => {
    expect(sanitizeImportedFields(undefined)).toEqual([])
    expect(sanitizeImportedFields({})).toEqual([])
    expect(sanitizeImportedFields('fields')).toEqual([])
  })
})
