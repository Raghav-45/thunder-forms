import { BaseFieldConfig } from '@/components/FormBuilder/types/types'

export interface TextInputConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-input'
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}
