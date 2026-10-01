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

export { FormFieldDefinition } from "#/features/form-builder/elements/base";

import { CheckboxFieldDefinition } from "#/features/form-builder/elements/fields/checkbox";
import { DatePickerFieldDefinition } from "#/features/form-builder/elements/fields/date-picker";
import { DateTimePickerFieldDefinition } from "#/features/form-builder/elements/fields/datetime-picker";
import { FileUploadFieldDefinition } from "#/features/form-builder/elements/fields/file-upload";
import { MultiSelectFieldDefinition } from "#/features/form-builder/elements/fields/multi-select";
import { NumberInputFieldDefinition } from "#/features/form-builder/elements/fields/number-input";
import { RadioGroupFieldDefinition } from "#/features/form-builder/elements/fields/radio-group";
import { RatingFieldDefinition } from "#/features/form-builder/elements/fields/rating";
import { SingleSelectFieldDefinition } from "#/features/form-builder/elements/fields/single-select";
import { SliderFieldDefinition } from "#/features/form-builder/elements/fields/slider";
import { SwitchFieldDefinition } from "#/features/form-builder/elements/fields/switch-field";
import { TextAreaFieldDefinition } from "#/features/form-builder/elements/fields/text-area";
import { TextInputFieldDefinition } from "#/features/form-builder/elements/fields/text-input";
import { TimePickerFieldDefinition } from "#/features/form-builder/elements/fields/time-picker";

const FIELD_DEFINITIONS = [
	new TextInputFieldDefinition(),
	new MultiSelectFieldDefinition(),
	new TextAreaFieldDefinition(),
	new SwitchFieldDefinition(),
	new DatePickerFieldDefinition(),
	new CheckboxFieldDefinition(),
	new NumberInputFieldDefinition(),
	new SingleSelectFieldDefinition(),
	new RadioGroupFieldDefinition(),
	new SliderFieldDefinition(),
	new DateTimePickerFieldDefinition(),
	new FileUploadFieldDefinition(),
	new TimePickerFieldDefinition(),
	new RatingFieldDefinition(),
] as const;

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
	[K in (typeof FIELD_DEFINITIONS)[number]["identifier"]]: {
		component: (typeof FIELD_DEFINITIONS)[number]["component"];
		editor: (typeof FIELD_DEFINITIONS)[number]["editor"];
		getValidationSchema: (typeof FIELD_DEFINITIONS)[number]["getValidationSchema"];
		defaultConfig: (typeof FIELD_DEFINITIONS)[number]["defaultConfig"];
	};
};

/** Union type of all field configs */
export type FieldConfig = ReturnType<
	(typeof FIELD_DEFINITIONS)[number]["defaultConfig"]
>;

/** Mutable list retained for existing builder consumers. */
export const AVAILABLE_FIELDS: string[] = Object.keys(FIELD_REGISTRY);
