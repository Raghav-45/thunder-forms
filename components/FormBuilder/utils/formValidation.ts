import { FieldConfig, FIELD_REGISTRY } from '@/components/FormBuilder/elements'

/**
 * CENTRALIZED FORM VALIDATION UTILITY
 * 
 * This utility provides a centralized way to validate form fields using the FIELD_REGISTRY.
 * All validation schemas are automatically picked up from the registry, so you only need to
 * update the FIELD_REGISTRY when adding new field types!
 * 
 * HOW TO ADD NEW FIELD TYPES:
 * 1. Create your new field type (e.g., DatePicker) in components/FormBuilder/elements/date-picker/
 * 2. Add the validation schema function in date-picker/types.ts (e.g., getDatePickerValidationSchema)
 * 3. Update FIELD_REGISTRY in components/FormBuilder/elements/index.ts with your new field
 * 4. That's it! The validation will work automatically everywhere!
 */

/**
 * Validates a form field using its validation schema from the FIELD_REGISTRY
 * @param field - The field configuration
 * @param value - The value to validate
 * @returns Error message string if validation fails, null if valid
 */
export const validateFormField = (field: FieldConfig, value: unknown): string | null => {
  try {
    const fieldType = (field as { uniqueIdentifier: string }).uniqueIdentifier;
    const fieldRegistry = FIELD_REGISTRY[fieldType as keyof typeof FIELD_REGISTRY];
    
    if (!fieldRegistry?.getValidationSchema) {
      console.warn(`No validator found for field type: ${fieldType}`)
      return null
    }

    // Get the validation schema from the registry and validate
    const schema = fieldRegistry.getValidationSchema(field as never)
    schema.parse(value)
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

/**
 * Validates all fields in a form
 * @param fields - Array of field configurations
 * @param formData - Object containing field values
 * @returns Object containing field IDs as keys and error messages as values
 */
export const validateFormFields = (
  fields: FieldConfig[], 
  formData: Record<string, unknown>
): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  fields.forEach(field => {
    const value = formData[field.id]
    
    // Section headers are display-only — skip validation entirely
    if (field.uniqueIdentifier === 'section-header') return

    // Basic required validation
    if (field.required) {
      // Boolean fields (switch, checkbox): undefined/null means unanswered, true/false are both valid
      if (field.uniqueIdentifier === 'switch-field' || field.uniqueIdentifier === 'checkbox') {
        if (typeof value !== 'boolean') {
          errors[field.id] = `${field.label} is required`
          return
        }
      } else if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors[field.id] = `${field.label} is required`
        return
      }
    }

    // Field-specific validation
    const error = validateFormField(field, value)
    if (error) {
      errors[field.id] = error
    }
  })
  
  return errors
}