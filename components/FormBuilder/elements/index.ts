/**
 * This index file serves as the primary entry point for all form field components.
 * It re-exports [components, editors, and types] from their respective subdirectories.
 *
 * Additionally, this file holds the `FIELD_REGISTRY` variable, a variable of all available form field
 * This registry facilitates dynamic rendering, configuration, and management of form fields.
 */

import MultiSelect from './multi-select'
import { MultiSelectEditor } from './multi-select/editor'
import type { MultiSelectConfig } from './multi-select/types'
import TextArea from './text-area'
import { TextAreaEditor } from './text-area/editor'
import type { TextAreaConfig } from './text-area/types'
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

// Text Area
export { default as TextArea } from './text-area'
export { TextAreaEditor } from './text-area/editor'
export type { TextAreaConfig } from './text-area/types'

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
      description: 'Provide your name for identification.',
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
  'text-area': {
    component: TextArea,
    editor: TextAreaEditor,
    defaultConfig: (): TextAreaConfig => ({
      id: `textarea_${Date.now()}`,
      type: 'text-input',
      label: 'Your Message',
      placeholder: 'Type your message here.',
      description: 'Your message will be copied to the support team.',
      required: false,
      disabled: false,
      maxLength: undefined,
    }),
  },
} as const

// Union type for all field configs
export type FieldConfig = TextInputConfig | MultiSelectConfig | TextAreaConfig
