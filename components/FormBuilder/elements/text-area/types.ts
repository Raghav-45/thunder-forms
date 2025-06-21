import { BaseFieldConfig } from '@/components/FormBuilder/types/types'

export interface TextAreaConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-area',
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}
