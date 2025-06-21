// components/FormBuilder/elements/multi-select/types.ts
import { BaseFieldConfig } from '../../types/types'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface MultiSelectConfig extends BaseFieldConfig {
  type: 'multi-select'
  options: SelectOption[]
  minSelections?: number
  maxSelections?: number
  searchable?: boolean
  allowCustomValues?: boolean
}
