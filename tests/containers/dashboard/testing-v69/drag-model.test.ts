import type { FieldConfig } from '@/features/form-builder/elements'
import type { FormSection, FormStructure } from '@/features/form-builder/form-structure'
import {
  CANVAS_DROP_ID,
  fieldCount,
  moveExistingField,
  removeField,
  removePage,
  removeSection,
  stagePaletteField,
  stagePaletteSection,
  updateField,
} from '@/containers/dashboard/testing-v69/drag-model'
import { describe, expect, it } from 'vitest'

const field = (id: string): FieldConfig =>
  ({
    id,
    label: id,
    uniqueIdentifier: 'text-input',
  }) as FieldConfig

const section = (id: string, fields: FieldConfig[] = []): FormSection => ({
  id,
  fields,
})

const form = (sections: FormSection[]): FormStructure => ({
  pages: [{ id: 'page-a', sections }],
})

const fieldIds = (structure: FormStructure): string[] =>
  structure.pages[0].sections.flatMap((item) =>
    item.fields.map((entry) => entry.id),
  )

describe('v69 drag model', () => {
  it('creates a section when a palette field lands on an empty canvas', () => {
    const result = stagePaletteField(form([]), 'page-a', field('palette'), {
      id: CANVAS_DROP_ID,
    })

    expect(result.placed).toBe(true)
    expect(result.structure.pages[0].sections).toHaveLength(1)
    expect(fieldIds(result.structure)).toEqual(['palette'])
  })

  it('appends a palette field to the canvas first section', () => {
    const result = stagePaletteField(
      form([section('section-a', [field('field-a')])]),
      'page-a',
      field('palette'),
      { id: CANVAS_DROP_ID },
    )

    expect(result.placed).toBe(true)
    expect(fieldIds(result.structure)).toEqual(['field-a', 'palette'])
  })

  it('places a palette field before or after a field target', () => {
    const initial = form([
      section('section-a', [field('field-a'), field('field-b')]),
    ])

    const before = stagePaletteField(initial, 'page-a', field('before'), {
      id: 'field-b',
      insertAfter: false,
    })
    const after = stagePaletteField(initial, 'page-a', field('after'), {
      id: 'field-b',
      insertAfter: true,
    })

    expect(fieldIds(before.structure)).toEqual([
      'field-a',
      'before',
      'field-b',
    ])
    expect(fieldIds(after.structure)).toEqual([
      'field-a',
      'field-b',
      'after',
    ])
  })

  it('places a palette field at the top or bottom of a section target', () => {
    const initial = form([
      section('section-a', [field('field-a'), field('field-b')]),
    ])

    const first = stagePaletteField(initial, 'page-a', field('first'), {
      id: 'section-a',
      insertAfter: false,
    })
    const last = stagePaletteField(initial, 'page-a', field('last'), {
      id: 'section-a',
    })

    expect(fieldIds(first.structure)).toEqual([
      'first',
      'field-a',
      'field-b',
    ])
    expect(fieldIds(last.structure)).toEqual([
      'field-a',
      'field-b',
      'last',
    ])
  })

  it('repositions one staged palette field without duplicating it', () => {
    const initial = form([
      section('section-a', [field('field-a')]),
      section('section-b'),
    ])
    const staged = stagePaletteField(initial, 'page-a', field('palette'), {
      id: 'section-a',
    }).structure
    const repositioned = stagePaletteField(staged, 'page-a', field('palette'), {
      id: 'section-b',
    }).structure

    expect(fieldIds(repositioned)).toEqual(['field-a', 'palette'])
    expect(repositioned.pages[0].sections[0].fields).toHaveLength(1)
    expect(repositioned.pages[0].sections[1].fields).toHaveLength(1)
  })

  it('moves an existing field across sections without changing its identity', () => {
    const moved = moveExistingField(
      form([
        section('section-a', [field('field-a'), field('field-b')]),
        section('section-b', [field('field-c')]),
      ]),
      'page-a',
      'field-b',
      { id: 'field-c', insertAfter: false },
    )

    expect(moved.pages[0].sections[0].fields.map((item) => item.id)).toEqual([
      'field-a',
    ])
    expect(moved.pages[0].sections[1].fields.map((item) => item.id)).toEqual([
      'field-b',
      'field-c',
    ])
  })

  it('reorders an existing field before or after a field in its section', () => {
    const initial = form([
      section('section-a', [field('field-a'), field('field-b'), field('field-c')]),
    ])

    const before = moveExistingField(initial, 'page-a', 'field-a', {
      id: 'field-c',
    })
    const after = moveExistingField(initial, 'page-a', 'field-c', {
      id: 'field-a',
      insertAfter: true,
    })

    expect(fieldIds(before)).toEqual(['field-b', 'field-a', 'field-c'])
    expect(fieldIds(after)).toEqual(['field-a', 'field-c', 'field-b'])
  })

  it('keeps a self-drop or unknown field move as a no-op', () => {
    const initial = form([section('section-a', [field('field-a')])])

    expect(
      moveExistingField(initial, 'page-a', 'field-a', { id: 'field-a' }),
    ).toBe(initial)
    expect(
      moveExistingField(initial, 'page-a', 'missing-field', { id: 'field-a' }),
    ).toBe(initial)
  })

  it('keeps an existing field when its target is invalid', () => {
    const initial = form([section('section-a', [field('field-a')])])

    const result = moveExistingField(initial, 'page-a', 'field-a', {
      id: 'missing-target',
    })

    expect(result).toEqual(initial)
  })

  it('does not stage a palette field on an invalid target', () => {
    const initial = form([section('section-a', [field('field-a')])])

    const result = stagePaletteField(initial, 'page-a', field('palette'), {
      id: 'missing-target',
    })

    expect(result.placed).toBe(false)
    expect(result.structure).toEqual(initial)
  })

  it('moves an existing field to the canvas first section', () => {
    const moved = moveExistingField(
      form([
        section('section-a', [field('field-a')]),
        section('section-b', [field('field-b')]),
      ]),
      'page-a',
      'field-b',
      { id: CANVAS_DROP_ID },
    )

    expect(moved.pages[0].sections[0].fields.map((item) => item.id)).toEqual([
      'field-a',
      'field-b',
    ])
    expect(moved.pages[0].sections[1].fields).toEqual([])
  })

  it('stages palette sections at the canvas end and before a target section', () => {
    const initial = form([section('section-a'), section('section-b')])
    const appended = stagePaletteSection(initial, 'page-a', section('palette-a'), {
      id: CANVAS_DROP_ID,
    }).structure
    const inserted = stagePaletteSection(appended, 'page-a', section('palette-b'), {
      id: 'section-b',
      insertAfter: false,
    }).structure

    expect(inserted.pages[0].sections.map((item) => item.id)).toEqual([
      'section-a',
      'palette-b',
      'section-b',
      'palette-a',
    ])
  })

  it('places a palette section after its target when requested', () => {
    const initial = form([section('section-a'), section('section-b')])

    const result = stagePaletteSection(initial, 'page-a', section('palette'), {
      id: 'section-a',
      insertAfter: true,
    })

    expect(result.placed).toBe(true)
    expect(result.structure.pages[0].sections.map((item) => item.id)).toEqual([
      'section-a',
      'palette',
      'section-b',
    ])
  })

  it('does not materialize a palette section on an invalid target', () => {
    const initial = form([section('section-a')])

    const result = stagePaletteSection(initial, 'page-a', section('palette'), {
      id: 'missing-target',
    })

    expect(result.placed).toBe(false)
    expect(result.structure).toEqual(initial)
  })

  it('keeps inactive pages unchanged during an active-page drop', () => {
    const initial: FormStructure = {
      pages: [
        { id: 'page-a', sections: [] },
        { id: 'page-b', sections: [section('section-b', [field('field-b')])] },
      ],
    }

    const result = stagePaletteField(initial, 'page-a', field('palette'), {
      id: CANVAS_DROP_ID,
    })

    expect(fieldIds(result.structure)).toEqual(['palette'])
    expect(result.structure.pages[1]).toEqual(initial.pages[1])
  })

  it('removes and updates only the requested model item', () => {
    const initial = form([
      section('section-a', [field('field-a')]),
      section('section-b', [field('field-b')]),
    ])
    const updated = updateField(
      initial,
      'page-a',
      'section-b',
      { ...field('field-b'), label: 'Changed' },
    )
    const withoutField = removeField(updated, 'page-a', 'section-a', 'field-a')
    const withoutSection = removeSection(withoutField, 'page-a', 'section-b')

    expect(updated.pages[0].sections[0].fields[0].label).toBe('field-a')
    expect(updated.pages[0].sections[1].fields[0].label).toBe('Changed')
    expect(withoutField.pages[0].sections[0].fields).toEqual([])
    expect(withoutSection.pages[0].sections.map((item) => item.id)).toEqual([
      'section-a',
    ])
  })

  it('leaves unrelated fields untouched for invalid remove or update targets', () => {
    const initial = form([section('section-a', [field('field-a')])])

    const afterRemove = removeField(
      initial,
      'page-a',
      'missing-section',
      'field-a',
    )
    const afterUpdate = updateField(
      initial,
      'page-a',
      'section-a',
      field('missing-field'),
    )

    expect(afterRemove).toEqual(initial)
    expect(afterUpdate).toEqual(initial)
  })

  it('removes one page but preserves the final page', () => {
    const initial: FormStructure = {
      pages: [
        { id: 'page-a', sections: [section('section-a')] },
        { id: 'page-b', sections: [section('section-b')] },
      ],
    }

    const afterRemove = removePage(initial, 'page-a')

    expect(afterRemove.pages.map((page) => page.id)).toEqual(['page-b'])
    expect(removePage(afterRemove, 'page-b')).toBe(afterRemove)
  })

  it('counts fields across pages and sections in order', () => {
    const structure: FormStructure = {
      pages: [
        { id: 'page-a', sections: [section('section-a', [field('field-a')])] },
        {
          id: 'page-b',
          sections: [section('section-b', [field('field-b'), field('field-c')])],
        },
      ],
    }

    expect(fieldCount(structure)).toBe(3)
  })
})
