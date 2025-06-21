import { FIELD_REGISTRY, FieldConfig } from '@/components/FormBuilder/elements'
import { avaliableFieldsType } from '@/components/FormBuilder/types/types'

// Get the component for a specific field type
export const getFieldComponent = (fieldType: avaliableFieldsType) => {
  const registry = FIELD_REGISTRY[fieldType]
  if (!registry) {
    throw new Error(`Unknown field type: ${fieldType}`)
  }
  return registry.component
}

// Get the editor for a specific field type
export const getFieldEditor = (fieldType: avaliableFieldsType) => {
  const registry = FIELD_REGISTRY[fieldType]
  if (!registry) {
    throw new Error(`Unknown field type: ${fieldType}`)
  }
  return registry.editor
}

// Create a default configuration for a specific field type
export const createDefaultFieldConfig = (
  fieldType: avaliableFieldsType
): FieldConfig => {
  const registry = FIELD_REGISTRY[fieldType]
  if (!registry) {
    throw new Error(`Unknown field type: ${fieldType}`)
  }
  return registry.defaultConfig()
}

export const validateFieldConfig = (config: FieldConfig): string[] => {
  const errors: string[] = []

  // Basic validation
  if (!config.id?.trim()) {
    errors.push('Field ID is required')
  }

  if (!config.label?.trim()) {
    errors.push('Field label is required')
  }

  return errors
}
