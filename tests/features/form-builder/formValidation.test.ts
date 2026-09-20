import type { FieldConfig } from '@/features/form-builder/elements'
import type { avaliableFieldsType } from '@/features/form-builder/types'
import { validateFormFields } from '@/features/form-builder/utils/formValidation'
import { describe, expect, it } from 'vitest'

const field = (
  id: string,
  uniqueIdentifier: avaliableFieldsType,
  extra: Record<string, unknown> = {},
  required = false,
): FieldConfig =>
  ({
    id,
    label: id,
    uniqueIdentifier,
    required,
    ...extra,
  }) as FieldConfig

describe('validateFormFields with untouched optional fields', () => {
  it('accepts empty values for every optional field type', () => {
    const fields = [
      field('name', 'text-input', { inputType: 'email' }),
      field('age', 'number-input'),
      field('day', 'date-picker'),
      field('moment', 'datetime-picker'),
      field('plan', 'single-select'),
      field('contact', 'radio-group'),
      field('tags', 'multi-select'),
      field('bio', 'text-area'),
      field('portfolio', 'file-upload'),
    ]
    const data: Record<string, unknown> = {
      name: '',
      age: '',
      day: '',
      moment: '',
      plan: '',
      contact: '',
      tags: [],
      bio: '',
      portfolio: [],
    }

    expect(validateFormFields(fields, data)).toEqual({})
  })

  it('accepts falsy-but-present values for optional toggles and sliders', () => {
    const fields = [
      field('agree', 'checkbox'),
      field('notify', 'switch-field'),
      field('level', 'slider'),
    ]

    expect(
      validateFormFields(fields, { agree: false, notify: false, level: 0 }),
    ).toEqual({})
  })

  it('still rejects empty values for required fields', () => {
    const fields = [
      field('name', 'text-input', {}, true),
      field('plan', 'single-select', {}, true),
      field('agree', 'switch-field', {}, true),
    ]

    const errors = validateFormFields(fields, {
      name: '',
      plan: '',
      agree: undefined,
    })

    expect(Object.keys(errors).sort()).toEqual(['agree', 'name', 'plan'])
  })

  it('still rejects invalid non-empty values for optional fields', () => {
    const fields = [field('name', 'text-input', { inputType: 'email' })]

    expect(validateFormFields(fields, { name: 'not-an-email' })).toEqual({
      name: 'Invalid email address',
    })
    expect(validateFormFields(fields, { name: 'a@b.co' })).toEqual({})
  })

  it('requires valid server-issued file upload receipts', () => {
    const files = [field('portfolio', 'file-upload', { maxFiles: 1 }, true)]
    const validReceipt = {
      id: 'upload-1',
      name: 'portfolio.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    }

    expect(validateFormFields(files, { portfolio: [] })).toEqual({
      portfolio: 'portfolio is required',
    })
    expect(validateFormFields(files, { portfolio: [validReceipt] })).toEqual({})
    expect(validateFormFields(files, { portfolio: [{ id: 'upload-1' }] })).toEqual({
      portfolio: 'Required',
    })
  })
})
