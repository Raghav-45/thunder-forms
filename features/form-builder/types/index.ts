import { FIELD_REGISTRY } from '@/features/form-builder/elements'

export type FieldType = { name: string; isAvailable: boolean; index?: number }

/**
 * Serves as the foundational interface & specifies common properties like id, label, placeholder, required, disabled, and description.
 */
export interface BaseFieldConfig {
  id: string
  uniqueIdentifier: AvailableFieldsType
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
  onUploadStateChange?: (fieldId: string, isUploading: boolean) => void
  onBlur?: () => void
  error?: string
  /** Present only when a field needs the public form's server API. */
  formId?: string
}

export interface EditorProps<T extends BaseFieldConfig = BaseFieldConfig> {
  field: T
  onUpdate: (field: T) => void
  onClose: () => void
  /** Present when the field belongs to a form already saved by the builder. */
  formId?: string
  /** Whether this field itself is included in the saved form structure. */
  isPersisted?: boolean
}

/** Represents all available field identifiers. */
export type AvailableFieldsType = keyof typeof FIELD_REGISTRY

/** Mutable list retained for existing builder consumers. */
export const AVAILABLE_FIELDS: string[] = Object.keys(FIELD_REGISTRY)
