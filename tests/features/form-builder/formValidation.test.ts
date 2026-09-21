import type { FieldConfig } from '@/features/form-builder/elements'
import type { AvailableFieldsType } from '@/features/form-builder/types'
import { validateFormFields } from '@/features/form-builder/utils/formValidation'
import { describe, expect, it } from 'vitest'

const field = (
  id: string,
  uniqueIdentifier: AvailableFieldsType,
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
      field('time', 'time-picker'),
      field('rating', 'rating'),
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
      time: '',
      rating: '',
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

  it('validates time-of-day and elapsed-duration values', () => {
    const fields = [
      field('time', 'time-picker', { mode: 'time', minuteStep: 15 }, true),
      field('duration', 'time-picker', { mode: 'duration' }, true),
    ]

    expect(validateFormFields(fields, { time: '09:30', duration: '2:45' })).toEqual({})
    expect(validateFormFields(fields, { time: '09:17', duration: '2:61' })).toEqual({
      time: 'Enter a valid time',
      duration: 'Enter a valid duration',
    })
  })

  it('validates whole and half ratings within their configured scale', () => {
    const fields = [
      field('rating', 'rating', { maxRating: 5, step: 0.5 }, true),
    ]

    expect(validateFormFields(fields, { rating: 3.5 })).toEqual({})
    expect(validateFormFields(fields, { rating: 3.2 })).toEqual({
      rating: 'Choose a rating from 1 to 5',
    })
    expect(validateFormFields(fields, { rating: 6 })).toEqual({
      rating: 'Choose a rating from 1 to 5',
    })
  })

  it('enforces configured number and slider increments', () => {
    const fields = [
      field(
        'amount',
        'number-input',
        { allowDecimals: true, min: 0.1, max: 1, step: 0.25 },
        true,
      ),
      field(
        'volume',
        'slider',
        { min: 0.1, max: 1, step: 0.25 },
        true,
      ),
    ]

    expect(validateFormFields(fields, { amount: 0.35, volume: 0.6 })).toEqual({})
    expect(validateFormFields(fields, { amount: 0.4, volume: 0.4 })).toEqual({
      amount: 'Must increment by 0.25',
      volume: 'Value must increment by 0.25',
    })
  })

  it('rejects disabled configured choices', () => {
    const fields = [
      field(
        'plan',
        'single-select',
        {
          options: [
            { id: 'free', label: 'Free', value: 'free' },
            { id: 'pro', label: 'Pro', value: 'pro', disabled: true },
          ],
        },
        true,
      ),
      field(
        'contact',
        'radio-group',
        {
          options: [
            { id: 'email', label: 'Email', value: 'email' },
            { id: 'phone', label: 'Phone', value: 'phone', disabled: true },
          ],
        },
        true,
      ),
      field(
        'tools',
        'multi-select',
        {
          allowCustomValues: false,
          options: [
            { id: 'figma', label: 'Figma', value: 'figma' },
            { id: 'sketch', label: 'Sketch', value: 'sketch', disabled: true },
          ],
        },
        true,
      ),
    ]

    expect(
      validateFormFields(fields, {
        plan: 'pro',
        contact: 'phone',
        tools: ['sketch'],
      }),
    ).toEqual({
      plan: 'Please select a valid option',
      contact: 'Please select a valid option',
      tools: 'Invalid option selected',
    })
    expect(
      validateFormFields(fields, {
        plan: 'free',
        contact: 'email',
        tools: ['figma'],
      }),
    ).toEqual({})
  })

  it('allows custom multi-select values but rejects disabled configured values', () => {
    const fields = [
      field(
        'tags',
        'multi-select',
        {
          allowCustomValues: true,
          options: [
            { id: 'open', label: 'Open', value: 'open' },
            { id: 'closed', label: 'Closed', value: 'closed', disabled: true },
          ],
        },
        true,
      ),
    ]

    expect(validateFormFields(fields, { tags: ['custom-tag'] })).toEqual({})
    expect(validateFormFields(fields, { tags: ['closed'] })).toEqual({
      tags: 'Invalid option selected',
    })
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
