import { FIELD_REGISTRY } from '../elements'

export type FieldType = { name: string; isAvailable: boolean; index?: number }

export interface BaseFieldConfig {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  description?: string
}

export interface FieldProps<T extends BaseFieldConfig = BaseFieldConfig> {
  field: T
  value: unknown
  onChange: (value: unknown) => void
  onBlur?: () => void
  error?: string
}

export interface EditorProps<T extends BaseFieldConfig = BaseFieldConfig> {
  field: T
  onUpdate: (field: T) => void
  onClose: () => void
}

/**
 * Represents all available field in FIELD_REGISTRY.
 */
export const AVAILABLE_FIELDS = Object.keys(FIELD_REGISTRY)

/**
 * Represents type all available field in FIELD_REGISTRY.
 */
export type avaliableFieldsType = keyof typeof FIELD_REGISTRY
