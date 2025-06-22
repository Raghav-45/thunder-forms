import { FIELD_REGISTRY, FieldConfig } from '@/components/FormBuilder/elements'
import { avaliableFieldsType } from '@/components/FormBuilder/types/types'

// Get the component for a specific field type
export const getFieldComponent = (uniqueIdentifier: avaliableFieldsType) => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
  }
  return registry.component
}

// Get the editor for a specific field type
export const getFieldEditor = (uniqueIdentifier: avaliableFieldsType) => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
  }
  return registry.editor
}

// Create a default configuration for a specific field type
export const createDefaultFieldConfig = (
  uniqueIdentifier: avaliableFieldsType
): FieldConfig => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
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
