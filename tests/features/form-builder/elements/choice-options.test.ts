import {
  hasValidChoiceOptions,
  hasValidChoiceOptionValues,
  isChoiceOptionValueInvalid,
  normalizeChoiceOptions,
} from '@/features/form-builder/elements/choice-options'
import { describe, expect, it } from 'vitest'

describe('choice options', () => {
  it('accepts nonblank unique submitted values', () => {
    expect(
      hasValidChoiceOptionValues([{ value: 'yes' }, { value: 'no' }]),
    ).toBe(true)
  })

  it('rejects blank and duplicate submitted values', () => {
    expect(hasValidChoiceOptionValues([{ value: ' ' }])).toBe(false)
    expect(
      hasValidChoiceOptionValues([{ value: 'yes' }, { value: 'yes' }]),
    ).toBe(false)
  })

  it('identifies exactly which submitted values are invalid', () => {
    const options = [{ value: 'same' }, { value: 'same' }, { value: 'other' }]

    expect(isChoiceOptionValueInvalid('same', options)).toBe(true)
    expect(isChoiceOptionValueInvalid('other', options)).toBe(false)
  })

  it('requires stable option IDs as well as valid submitted values', () => {
    expect(
      hasValidChoiceOptions([
        { id: 'option-a', label: 'A', value: 'a' },
        { id: 'option-b', label: 'B', value: 'b' },
      ]),
    ).toBe(true)
    expect(
      hasValidChoiceOptions([
        { id: 'option-a', label: 'A', value: 'a' },
        { id: 'option-a', label: 'B', value: 'b' },
      ]),
    ).toBe(false)
  })

  it('repairs imported choice options without changing valid labels or values', () => {
    const options = normalizeChoiceOptions([
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ])

    expect(options).toEqual([
      expect.objectContaining({ id: expect.any(String), label: 'Yes', value: 'yes' }),
      expect.objectContaining({ id: expect.any(String), label: 'No', value: 'no' }),
    ])
    expect(hasValidChoiceOptions(options)).toBe(true)
  })

  it('repairs invalid imported values into stable, unique values', () => {
    const options = normalizeChoiceOptions([
      { label: 'First', value: '' },
      { label: 'Second', value: 'same' },
      { label: 'Third', value: 'same' },
    ])

    expect(options.map((option) => option.value)).toEqual([
      'option_1',
      'same',
      'same_2',
    ])
    expect(hasValidChoiceOptions(options)).toBe(true)
  })
})
