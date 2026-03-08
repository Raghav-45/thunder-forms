'use client'

/**
 * FIELD ELEMENT REGISTRY
 *
 * Single entry point for all form field types. Each field type is a class
 * extending FormFieldDefinition, co-locating config, component, editor,
 * validation, and defaults in one file.
 *
 * To add a new field type:
 *  1. Create `elements/fields/your-field.tsx`
 *  2. Extend `FormFieldDefinition<YourConfig>`
 *  3. Implement all abstract members
 *  4. Add a new instance to FIELD_DEFINITIONS below
 */

export { FormFieldDefinition } from './base'

import { TextInputFieldDefinition } from './fields/text-input'
import { MultiSelectFieldDefinition } from './fields/multi-select'
import { TextAreaFieldDefinition } from './fields/text-area'
import { SwitchFieldDefinition } from './fields/switch-field'
import { DatePickerFieldDefinition } from './fields/date-picker'
import { SectionHeaderFieldDefinition } from './fields/section-header'
import { CheckboxFieldDefinition } from './fields/checkbox'
import { NumberInputFieldDefinition } from './fields/number-input'
import { SingleSelectFieldDefinition } from './fields/single-select'
import { RadioGroupFieldDefinition } from './fields/radio-group'
import { SliderFieldDefinition } from './fields/slider'
import { DateTimePickerFieldDefinition } from './fields/datetime-picker'

const FIELD_DEFINITIONS = [
  new TextInputFieldDefinition(),
  new MultiSelectFieldDefinition(),
  new TextAreaFieldDefinition(),
  new SwitchFieldDefinition(),
  new DatePickerFieldDefinition(),
  new SectionHeaderFieldDefinition(),
  new CheckboxFieldDefinition(),
  new NumberInputFieldDefinition(),
  new SingleSelectFieldDefinition(),
  new RadioGroupFieldDefinition(),
  new SliderFieldDefinition(),
  new DateTimePickerFieldDefinition(),
] as const

/**
 * FIELD_REGISTRY — The runtime lookup table.
 *
 * Built automatically from FIELD_DEFINITIONS.
 * Usage: FIELD_REGISTRY['text-input'].component
 */
export const FIELD_REGISTRY = Object.fromEntries(
  FIELD_DEFINITIONS.map((def) => [
    def.identifier,
    {
      component: def.component,
      editor: def.editor,
      getValidationSchema: def.getValidationSchema.bind(def),
      defaultConfig: def.defaultConfig.bind(def),
    },
  ]),
) as {
  [K in (typeof FIELD_DEFINITIONS)[number]['identifier']]: {
    component: (typeof FIELD_DEFINITIONS)[number]['component']
    editor: (typeof FIELD_DEFINITIONS)[number]['editor']
    getValidationSchema: (typeof FIELD_DEFINITIONS)[number]['getValidationSchema']
    defaultConfig: (typeof FIELD_DEFINITIONS)[number]['defaultConfig']
  }
}

/** Union type of all field configs */
export type FieldConfig = ReturnType<
  (typeof FIELD_DEFINITIONS)[number]['defaultConfig']
>
