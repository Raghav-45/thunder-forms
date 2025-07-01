import { BaseFieldConfig } from '@/components/FormBuilder/types/types'
import { z } from 'zod'

export interface TextAreaConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-area'
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}

export const getTextAreaValidationSchema = (
  field: TextAreaConfig
): z.ZodTypeAny => {
  let schema = z.string()

  if (field.minLength) {
    schema = schema.min(
      field.minLength,
      `Must be at least ${field.minLength} characters`
    )
  }
  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `Must be at most ${field.maxLength} characters`
    )
  }
  if (field.pattern) {
    schema = schema.regex(new RegExp(field.pattern), 'Invalid format')
  }

  return field.required ? schema : schema.optional()
}
