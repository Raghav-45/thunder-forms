// components/FormBuilder/utils/field-registry.ts
import { FIELD_REGISTRY, FieldConfig } from '../elements'
import { avaliableFieldsType } from '../types/types'

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

  if (!config.type) {
    errors.push('Field type is required')
  }

  // Type-specific validation
  if (config.type === 'multi-select') {
    const multiSelectConfig = config as import('../elements').MultiSelectConfig
    if (!multiSelectConfig.options || multiSelectConfig.options.length === 0) {
      errors.push('Multi-select must have at least one option')
    }

    if (multiSelectConfig.minSelections && multiSelectConfig.maxSelections) {
      if (multiSelectConfig.minSelections > multiSelectConfig.maxSelections) {
        errors.push(
          'Minimum selections cannot be greater than maximum selections'
        )
      }
    }
  }

  if (config.type === 'text-input') {
    const textInputConfig = config as import('../elements').TextInputConfig
    if (textInputConfig.minLength && textInputConfig.maxLength) {
      if (textInputConfig.minLength > textInputConfig.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length')
      }
    }
  }

  return errors
}
