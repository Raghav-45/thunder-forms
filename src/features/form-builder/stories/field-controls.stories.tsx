import type { Meta } from "@storybook/react-vite";
import type { FormFieldDefinition } from "#/features/form-builder/elements/base";
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
import { FieldRendererHarness } from "#/features/form-builder/stories/field-story-harness";
import type { BaseFieldConfig } from "#/features/form-builder/types";

type FieldControlArgs<TConfig extends BaseFieldConfig> = Omit<
	TConfig,
	"id" | "uniqueIdentifier"
> & {
	value?: unknown;
	error?: string;
};

function createFieldControlStory<TConfig extends BaseFieldConfig>(
	definition: FormFieldDefinition<TConfig>,
	identifier: string,
	value?: unknown,
	argTypes: Record<string, unknown> = {},
) {
	const { id: _, uniqueIdentifier: __, ...config } = definition.defaultConfig();

	return {
		args: {
			...config,
			value,
			error: "",
		},
		argTypes: {
			...argTypes,
			error: { control: "text" },
		},
		render: (args: FieldControlArgs<TConfig>) => {
			const { value: currentValue, error, ...fieldConfig } = args;
			const field = {
				...fieldConfig,
				id: `storybook-controls-${identifier}`,
				uniqueIdentifier: definition.identifier,
			} as TConfig;

			return (
				<FieldRendererHarness
					key={JSON.stringify(args)}
					definition={definition}
					field={field}
					initialValue={currentValue}
					error={error}
				/>
			);
		},
	};
}

const meta = {
	title: "Form Builder/Controls",
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Use the Controls panel to configure the production renderer directly. Every setting comes from the field's default configuration.",
			},
		},
	},
} satisfies Meta;

export default meta;

export const TextInput = createFieldControlStory(
	new TextInputFieldDefinition(),
	"text-input",
	"Ada Lovelace",
	{
		inputType: {
			control: "select",
			options: ["text", "email", "password", "tel", "url"],
		},
	},
);

export const TextArea = createFieldControlStory(
	new TextAreaFieldDefinition(),
	"text-area",
	"A thoughtful response",
);

export const NumberInput = createFieldControlStory(
	new NumberInputFieldDefinition(),
	"number-input",
	42,
);

export const DatePicker = createFieldControlStory(
	new DatePickerFieldDefinition(),
	"date-picker",
);

export const DateTimePicker = createFieldControlStory(
	new DateTimePickerFieldDefinition(),
	"datetime-picker",
);

export const TimePicker = createFieldControlStory(
	new TimePickerFieldDefinition(),
	"time-picker",
);

export const SingleSelect = createFieldControlStory(
	new SingleSelectFieldDefinition(),
	"single-select",
);

export const MultiSelect = createFieldControlStory(
	new MultiSelectFieldDefinition(),
	"multi-select",
);

export const RadioGroup = createFieldControlStory(
	new RadioGroupFieldDefinition(),
	"radio-group",
);

export const Checkbox = createFieldControlStory(
	new CheckboxFieldDefinition(),
	"checkbox",
);

export const Switch = createFieldControlStory(
	new SwitchFieldDefinition(),
	"switch",
);

export const Slider = createFieldControlStory(
	new SliderFieldDefinition(),
	"slider",
);

export const Rating = createFieldControlStory(
	new RatingFieldDefinition(),
	"rating",
);

export const FileUpload = createFieldControlStory(
	new FileUploadFieldDefinition(),
	"file-upload",
);
