import { BaseFieldConfig } from '@/components/FormBuilder/types/types'

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
