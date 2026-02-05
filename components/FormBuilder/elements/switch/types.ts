import { BaseFieldConfig } from '@/components/FormBuilder/types/types'
import { z } from 'zod'

export interface SwitchConfig extends BaseFieldConfig {
  type: 'switch'
  uniqueIdentifier: 'switch-field'
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: boolean
  checkedLabel?: string
  uncheckedLabel?: string
}

export const getSwitchValidationSchema = (
  field: SwitchConfig
): z.ZodTypeAny => {
  const schema = z.boolean()
  return field.required ? schema : schema.optional()
}
