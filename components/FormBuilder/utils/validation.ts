import { FieldConfig } from '@/components/FormBuilder/elements'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const validateFormData = (
  fields: FieldConfig[],
  formData: Record<string, any>
): ValidationResult => {
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
    const value = formData[field.id]
    const fieldErrors = validateField(field, value)

    if (fieldErrors.length > 0) {
      errors[field.id] = fieldErrors[0] // Show first error only
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateField = (field: FieldConfig, value: any): string[] => {
  const errors: string[] = []

  // Required validation
  if (field.required) {
    if (field.type === 'multi-select') {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${field.label} is required`)
      }
    } else {
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(`${field.label} is required`)
      }
    }
  }

  // Skip further validation if no value provided and not required
  if (!value && !field.required) {
    return errors
  }

  // Type-specific validation
  switch (field.type) {
    case 'text-input':
      validateTextInput(
        field as import('../elements').TextInputConfig,
        value,
        errors
      )
      break
    case 'multi-select':
      validateMultiSelect(
        field as import('../elements').MultiSelectConfig,
        value,
        errors
      )
      break
  }

  return errors
}

const validateTextInput = (
  field: import('../elements').TextInputConfig,
  value: string,
  errors: string[]
) => {
  if (!value) return

  // Length validation
  if (field.minLength && value.length < field.minLength) {
    errors.push(`${field.label} must be at least ${field.minLength} characters`)
  }

  if (field.maxLength && value.length > field.maxLength) {
    errors.push(
      `${field.label} must be no more than ${field.maxLength} characters`
    )
  }

  // Pattern validation
  if (field.pattern) {
    try {
      const regex = new RegExp(field.pattern)
      if (!regex.test(value)) {
        errors.push(`${field.label} format is invalid`)
      }
    } catch (e) {
      console.warn(
        `Invalid regex pattern for field ${field.id}:`,
        field.pattern
      )
    }
  }

  // Input type validation
  switch (field.inputType) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`)
      }
      break
    case 'url':
      try {
        new URL(value)
      } catch {
        errors.push(`${field.label} must be a valid URL`)
      }
      break
    case 'tel':
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        errors.push(`${field.label} must be a valid phone number`)
      }
      break
  }
}

const validateMultiSelect = (
  field: import('../elements').MultiSelectConfig,
  value: string[],
  errors: string[]
) => {
  if (!Array.isArray(value)) return

  // Min/Max selections validation
  if (field.minSelections && value.length < field.minSelections) {
    errors.push(
      `${field.label} requires at least ${field.minSelections} selection${
        field.minSelections > 1 ? 's' : ''
      }`
    )
  }

  if (field.maxSelections && value.length > field.maxSelections) {
    errors.push(
      `${field.label} allows maximum ${field.maxSelections} selection${
        field.maxSelections > 1 ? 's' : ''
      }`
    )
  }

  // Validate that selected values exist in options (unless custom values are allowed)
  if (!field.allowCustomValues) {
    const validValues = field.options.map((opt) => opt.value)
    const invalidValues = value.filter((val) => !validValues.includes(val))

    if (invalidValues.length > 0) {
      errors.push(`${field.label} contains invalid selections`)
    }
  }
}
