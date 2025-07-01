import { BaseFieldConfig } from '@/components/FormBuilder/types/types'
import { z } from 'zod'

export interface TextInputConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-input'
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}

export const getTextInputValidationSchema = (
  field: TextInputConfig
): z.ZodTypeAny => {
  let schema: z.ZodString

  switch (field.inputType) {
    case 'email':
      schema = z.string().email('Invalid email address')
      break
    case 'url':
      schema = z.string().url('Invalid URL format')
      break
    case 'tel':
      schema = z.string()
      if (field.pattern) {
        schema = schema.regex(
          new RegExp(field.pattern),
          'Invalid phone number format'
        )
      }
      break
    default:
      schema = z.string()
      if (field.pattern) {
        schema = schema.regex(new RegExp(field.pattern), 'Invalid format')
      }
      break
  }

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

  return field.required ? schema : schema.optional()
}
