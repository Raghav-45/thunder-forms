import { FIELD_REGISTRY, FieldConfig } from '@/features/form-builder/elements'
import type { AvailableFieldsType } from '@/features/form-builder/types'

/**
 * HELPER FUNCTIONS FOR FORM BUILDER
 * 
 * These functions provide utilities for working with the FIELD_REGISTRY and field configurations.
 * 
 * VALIDATION RESPONSIBILITIES:
 * - This file: Field configuration validation (validateFieldConfig)
 * - formValidation.ts: User data validation (validateFormField, validateFormFields) 
 */

// Get the component for a specific field type
export const getFieldComponent = (uniqueIdentifier: AvailableFieldsType) => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
  }
  return registry.component
}

// Get the editor for a specific field type
export const getFieldEditor = (uniqueIdentifier: AvailableFieldsType) => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
  }
  return registry.editor
}

// Create a default configuration for a specific field type
export const createDefaultFieldConfig = (
  uniqueIdentifier: AvailableFieldsType
): FieldConfig => {
  const registry = FIELD_REGISTRY[uniqueIdentifier]
  if (!registry) {
    throw new Error(`Unknown field uniqueIdentifier: ${uniqueIdentifier}`)
  }
  return registry.defaultConfig()
}

/**
 * Validates field configuration properties (not user data)
 * This ensures the field definition itself is valid
 */
export const validateFieldConfig = (config: FieldConfig): string[] => {
  const errors: string[] = []

  // Basic validation
  if (!config.id?.trim()) {
    errors.push('Field ID is required')
  }

  if (!config.label?.trim()) {
    errors.push('Field label is required')
  }

  if (
    typeof config.uniqueIdentifier === 'string' &&
    !(config.uniqueIdentifier in FIELD_REGISTRY)
  ) {
    errors.push(`Unknown field type: ${config.uniqueIdentifier}`)
  }

  return errors
}
