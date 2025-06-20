// components/FormBuilder/elements/text-input/types.ts
import { BaseFieldConfig } from '../../types/types';

export interface TextInputConfig extends BaseFieldConfig {
  type: 'text-input';
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
}