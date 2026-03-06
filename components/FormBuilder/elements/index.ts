'use client'

/**
 * FIELD ELEMENT REGISTRY
 *
 * This module is the single entry point for all form field types.
 * Each field type is defined as a class extending FormFieldDefinition,
 * co-locating its config, component, editor, validation, and defaults
 * all in one file.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TO ADD A NEW FIELD TYPE:                                      │
 * │                                                                │
 * │  1. Create a new file in `elements/fields/your-field.tsx`      │
 * │  2. Extend `FormFieldDefinition<YourConfig>`                   │
 * │  3. Implement all abstract members (the compiler will tell     │
 * │     you if you miss any!)                                      │
 * │  4. Import and instantiate it below in FIELD_DEFINITIONS       │
 * │                                                                │
 * │  That's it — validation, rendering, editing all work           │
 * │  automatically everywhere in the app.                          │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ─── Base Class ──────────────────────────────────────────
export { FormFieldDefinition } from './base'

// ─── Field Definitions (class instances) ─────────────────
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

// ─── Re-export Types (backward compat) ───────────────────
export type { TextInputConfig } from './fields/text-input'
export type { MultiSelectConfig, SelectOption } from './fields/multi-select'
export type { TextAreaConfig } from './fields/text-area'
export type { SwitchConfig } from './fields/switch-field'
export type { DatePickerConfig } from './fields/date-picker'
export type { SectionHeaderConfig } from './fields/section-header'
export type { CheckboxConfig } from './fields/checkbox'
export type { NumberInputConfig } from './fields/number-input'
export type { SingleSelectConfig, SingleSelectOption } from './fields/single-select'
export type { RadioGroupConfig, RadioOption } from './fields/radio-group'
export type { SliderConfig } from './fields/slider'

// ─── Singleton Instances ─────────────────────────────────
// Used for both backward-compat re-exports AND FIELD_REGISTRY
const _textInput = new TextInputFieldDefinition()
const _multiSelect = new MultiSelectFieldDefinition()
const _textArea = new TextAreaFieldDefinition()
const _switchField = new SwitchFieldDefinition()
const _datePicker = new DatePickerFieldDefinition()
const _sectionHeader = new SectionHeaderFieldDefinition()
const _checkbox = new CheckboxFieldDefinition()
const _numberInput = new NumberInputFieldDefinition()
const _singleSelect = new SingleSelectFieldDefinition()
const _radioGroup = new RadioGroupFieldDefinition()
const _slider = new SliderFieldDefinition()

// ─── Re-export Components & Editors (backward compat) ────
export const TextInput = _textInput.component
export const TextInputEditor = _textInput.editor
export const MultiSelect = _multiSelect.component
export const MultiSelectEditor = _multiSelect.editor
export const TextArea = _textArea.component
export const TextAreaEditor = _textArea.editor
export const SwitchField = _switchField.component
export const SwitchEditor = _switchField.editor
export const DatePicker = _datePicker.component
export const DatePickerEditor = _datePicker.editor
export const SectionHeader = _sectionHeader.component
export const SectionHeaderEditor = _sectionHeader.editor
export const CheckboxField = _checkbox.component
export const CheckboxEditor = _checkbox.editor
export const NumberInput = _numberInput.component
export const NumberInputEditor = _numberInput.editor
export const SingleSelect = _singleSelect.component
export const SingleSelectEditor = _singleSelect.editor
export const RadioGroupField = _radioGroup.component
export const RadioGroupEditor = _radioGroup.editor
export const SliderField = _slider.component
export const SliderEditor = _slider.editor

// ─── Field Definitions Array ─────────────────────────────
const FIELD_DEFINITIONS = [
  _textInput,
  _multiSelect,
  _textArea,
  _switchField,
  _datePicker,
  _sectionHeader,
  _checkbox,
  _numberInput,
  _singleSelect,
  _radioGroup,
  _slider,
] as const

/**
 * FIELD_REGISTRY — The runtime lookup table.
 *
 * Built automatically from the class instances above.
 * Consumers access it as: FIELD_REGISTRY['text-input'].component
 *
 * This maintains full backward compatibility with the previous
 * folder-based registry.
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

// ─── Union type for all field configs ────────────────────
export type FieldConfig = ReturnType<
  (typeof FIELD_DEFINITIONS)[number]['defaultConfig']
>
