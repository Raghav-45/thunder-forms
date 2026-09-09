import { FieldConfig, FIELD_REGISTRY } from '@/features/form-builder/elements'

/**
 * Form validation dispatcher.
 *
 * Each field definition owns its renderer, editor, defaults, and Zod schema.
 * This utility looks up that field definition in `FIELD_REGISTRY` and uses its
 * `getValidationSchema` method for both public-form and API validation.
 */
export const validateFormField = (
  field: FieldConfig,
  value: unknown,
): string | null => {
  try {
    const fieldType = field.uniqueIdentifier
    const fieldRegistry = FIELD_REGISTRY[fieldType]

    if (!fieldRegistry?.getValidationSchema) {
      console.warn(`No validator found for field type: ${fieldType}`)
      return null
    }

    // The registry is selected dynamically, so TypeScript cannot infer its
    // matching concrete field config. The registry lookup guarantees the pair.
    fieldRegistry.getValidationSchema(field as never).parse(value)
    return null
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string }> }
      if (zodError.errors?.[0]?.message) {
        return zodError.errors[0].message
      }
    }
    return 'Invalid value'
  }
}

export const validateFormFields = (
  fields: FieldConfig[],
  formData: Record<string, unknown>,
): Record<string, string> => {
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
    const value = formData[field.id]

    // Required booleans accept both true and false; only a missing value fails.
    if (field.required) {
      if (
        field.uniqueIdentifier === 'switch-field' ||
        field.uniqueIdentifier === 'checkbox'
      ) {
        if (typeof value !== 'boolean') {
          errors[field.id] = `${field.label} is required`
          return
        }
      } else if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors[field.id] = `${field.label} is required`
        return
      }
    }

    // Field-specific constraints (length, options, dates, and so on).
    const error = validateFormField(field, value)
    if (error) {
      errors[field.id] = error
    }
  })

  return errors
}
