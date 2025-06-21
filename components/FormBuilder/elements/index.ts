// components/FormBuilder/elements/index.ts
import MultiSelect from './multi-select'
import { MultiSelectEditor } from './multi-select/editor'
import type { MultiSelectConfig } from './multi-select/types'
import TextInput from './text-input'
import { TextInputEditor } from './text-input/editor'
import type { TextInputConfig } from './text-input/types'

// Text Input
export { default as TextInput } from './text-input'
export { TextInputEditor } from './text-input/editor'
export type { TextInputConfig } from './text-input/types'

// Multi Select
export { default as MultiSelect } from './multi-select'
export { MultiSelectEditor } from './multi-select/editor'
export type { MultiSelectConfig, SelectOption } from './multi-select/types'

// Field Registry
export const FIELD_REGISTRY = {
  'text-input': {
    component: TextInput,
    editor: TextInputEditor,
    defaultConfig: (): TextInputConfig => ({
      id: `text_${Date.now()}`,
      type: 'text-input',
      label: 'Your Name',
      placeholder: 'e.g., John Doe',
      required: false,
      disabled: false,
      inputType: 'text',
    }),
  },
  'multi-select': {
    component: MultiSelect,
    editor: MultiSelectEditor,
    defaultConfig: (): MultiSelectConfig => ({
      id: `multiselect_${Date.now()}`,
      type: 'multi-select',
      label: 'Select your framework',
      placeholder: 'Select multiple options',
      required: false,
      disabled: false,
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Blueberry', value: 'blueberry' },
        { label: 'Grapes', value: 'grapes' },
        { label: 'Pineapple', value: 'pineapple' },
      ],
      searchable: true,
      allowCustomValues: false,
    }),
  },
} as const

// Union type for all field configs
export type FieldConfig = TextInputConfig | MultiSelectConfig
