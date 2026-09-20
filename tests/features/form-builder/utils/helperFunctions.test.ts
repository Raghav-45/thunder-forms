import { FIELD_REGISTRY } from '@/features/form-builder/elements'
import {
  createDefaultFieldConfig,
  getFieldComponent,
  getFieldEditor,
  validateFieldConfig,
} from '@/features/form-builder/utils/helperFunctions'
import type { AvailableFieldsType } from '@/features/form-builder/types'
import { describe, expect, it } from 'vitest'

const identifiers = Object.keys(FIELD_REGISTRY) as AvailableFieldsType[]

describe('form builder registry helpers', () => {
  it.each(identifiers)('creates a valid default config for %s', (identifier) => {
    const config = createDefaultFieldConfig(identifier)

    expect(config.id).not.toBe('')
    expect(config.uniqueIdentifier).toBe(identifier)
    expect(validateFieldConfig(config)).toEqual([])
  })

  it.each(identifiers)('returns registered renderer for %s', (identifier) => {
    expect(getFieldComponent(identifier)).toBe(FIELD_REGISTRY[identifier].component)
  })

  it.each(identifiers)('returns registered editor for %s', (identifier) => {
    expect(getFieldEditor(identifier)).toBe(FIELD_REGISTRY[identifier].editor)
  })

  it('rejects an unknown field type from registry access', () => {
    expect(() => getFieldComponent('unknown' as AvailableFieldsType)).toThrow(
      'Unknown field uniqueIdentifier: unknown',
    )
    expect(() => getFieldEditor('unknown' as AvailableFieldsType)).toThrow(
      'Unknown field uniqueIdentifier: unknown',
    )
    expect(() => createDefaultFieldConfig('unknown' as AvailableFieldsType)).toThrow(
      'Unknown field uniqueIdentifier: unknown',
    )
  })

  it('reports every missing and unknown configuration property', () => {
    const errors = validateFieldConfig({
      id: ' ',
      label: '',
      uniqueIdentifier: 'unknown',
    } as never)

    expect(errors).toEqual([
      'Field ID is required',
      'Field label is required',
      'Unknown field type: unknown',
    ])
  })
})
