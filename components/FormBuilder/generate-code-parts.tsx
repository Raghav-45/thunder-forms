/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodTypeAny } from 'zod'
import { FormFieldPayload } from '@/lib/validators/form'

export const generateZodSchema = (
  formFields: FormFieldPayload[]
): z.ZodObject<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  const processField = (field: FormFieldPayload): void => {
    if (field.variant === 'Label') return

    let fieldSchema: z.ZodTypeAny

    switch (field.variant) {
      case 'Checkbox':
        fieldSchema = z.boolean().default(true)
        break
      case 'Date Picker':
        fieldSchema = z.coerce.date()
        break
      case 'Datetime Picker':
        fieldSchema = z.coerce.date()
        break
      case 'Input':
        if (field.type === 'email') {
          fieldSchema = z.string().email()
          break
        } else if (field.type === 'number') {
          fieldSchema = z.coerce.number()
          break
        } else {
          fieldSchema = z.string()
          break
        }
      case 'Location Input':
        fieldSchema = z.tuple([
          z.string({
            required_error: 'Country is required',
          }),
          z.string().optional(), // State name, optional
        ])
        break
      case 'Slider':
        fieldSchema = z.coerce.number()
        break
      case 'Signature Input':
        fieldSchema = z.string({
          required_error: 'Signature is required',
        })
        break
      case 'Smart Datetime Input':
        fieldSchema = z.date()
        break
      case 'Number':
        fieldSchema = z.coerce.number()
        break
      case 'Switch':
        fieldSchema = z.boolean()
        break
      case 'Tags Input':
        fieldSchema = z
          .array(z.string())
          .nonempty('Please enter at least one item')
        break
      case 'Multi Select':
        fieldSchema = z
          .array(z.string())
          .nonempty('Please select at least one item')
        break
      default:
        fieldSchema = z.string()
    }

    if (field.min !== undefined && 'min' in fieldSchema) {
      fieldSchema = (fieldSchema as any).min(
        field.min,
        `Must be at least ${field.min}`
      )
    }
    if (field.max !== undefined && 'max' in fieldSchema) {
      fieldSchema = (fieldSchema as any).max(
        field.max,
        `Must be at most ${field.max}`
      )
    }

    if (field.required !== true) {
      fieldSchema = fieldSchema.optional()
    }
    schemaObject[field.name] = fieldSchema as ZodTypeAny // Ensure fieldSchema is of type ZodTypeAny
  }

  formFields.flat().forEach(processField)

  return z.object(schemaObject)
}

// New function to generate defaultValues
export const generateDefaultValues = (
  fields: FormFieldPayload[],
  existingDefaultValues: Record<string, any> = {}
): Record<string, any> => {
  const defaultValues: Record<string, any> = { ...existingDefaultValues }

  fields.flat().forEach((field) => {
    // Skip if field already has a default value
    if (defaultValues[field.name]) return

    // Handle field variants
    switch (field.variant) {
      case 'Multi Select':
        defaultValues[field.name] = ['React']
        break
      case 'Tags Input':
        defaultValues[field.name] = []
        break
      case 'Datetime Picker':
      case 'Smart Datetime Input':
      case 'Date Picker':
        defaultValues[field.name] = new Date()
        break
    }
  })

  return defaultValues
}
