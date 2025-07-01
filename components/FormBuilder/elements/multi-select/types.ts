import { BaseFieldConfig } from '@/components/FormBuilder/types/types'
import { z } from 'zod'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface MultiSelectConfig extends BaseFieldConfig {
  uniqueIdentifier: 'multi-select'
  options: SelectOption[]
  minSelections?: number
  maxSelections?: number
  searchable?: boolean
  allowCustomValues?: boolean
}

export const getMultiSelectValidationSchema = (
  field: MultiSelectConfig
): z.ZodTypeAny => {
  let schema: z.ZodTypeAny = z.array(z.string())

  if (field.minSelections) {
    schema = (schema as z.ZodArray<z.ZodString, 'many'>).min(
      field.minSelections,
      `Select at least ${field.minSelections} option${
        field.minSelections > 1 ? 's' : ''
      }`
    )
  }
  if (field.maxSelections) {
    schema = (schema as z.ZodArray<z.ZodString, 'many'>).max(
      field.maxSelections,
      `Select at most ${field.maxSelections} option${
        field.maxSelections > 1 ? 's' : ''
      }`
    )
  }

  if (!field.allowCustomValues) {
    const validValues = field.options.map((opt) => opt.value)
    schema = schema.refine(
      (values) =>
        (values as string[]).every((val) => validValues.includes(val)),
      'Invalid option selected'
    )
  }

  return field.required ? schema : schema.optional()
}
