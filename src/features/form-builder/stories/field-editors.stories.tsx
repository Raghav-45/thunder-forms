import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
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
import { FieldEditorHarness } from "#/features/form-builder/stories/field-story-harness";
import type { BaseFieldConfig } from "#/features/form-builder/types";

function storyField<TConfig extends BaseFieldConfig>(
	field: TConfig,
	identifier: string,
): TConfig {
	return {
		...field,
		id: `storybook-${identifier}`,
	};
}

const checkbox = new CheckboxFieldDefinition();
const datePicker = new DatePickerFieldDefinition();
const dateTimePicker = new DateTimePickerFieldDefinition();
const fileUpload = new FileUploadFieldDefinition();
const multiSelect = new MultiSelectFieldDefinition();
const numberInput = new NumberInputFieldDefinition();
const radioGroup = new RadioGroupFieldDefinition();
const rating = new RatingFieldDefinition();
const singleSelect = new SingleSelectFieldDefinition();
const slider = new SliderFieldDefinition();
const switchField = new SwitchFieldDefinition();
const textArea = new TextAreaFieldDefinition();
const textInput = new TextInputFieldDefinition();
const timePicker = new TimePickerFieldDefinition();

const meta = {
	title: "Form Builder/Editors",
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Each story uses the production field definition and its real builder editor. Change settings, save, and inspect the live preview behind the editor.",
			},
		},
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInputEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={textInput}
			field={storyField(textInput.defaultConfig(), "text-input")}
			initialValue="Ada Lovelace"
		/>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const editor = within(document.body);
		const label = await editor.findByLabelText("Field Label *");

		await userEvent.clear(label);
		await userEvent.type(label, "Preferred name");
		await userEvent.click(editor.getByRole("button", { name: "Save Changes" }));

		await expect(canvas.getByText("Preferred name")).toBeVisible();
		await userEvent.click(
			canvas.getByRole("button", { name: "Configure field" }),
		);
		await expect(
			editor.getByRole("heading", { name: "Configure Text Input" }),
		).toBeVisible();
	},
};

export const TextAreaEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={textArea}
			field={storyField(textArea.defaultConfig(), "text-area")}
			initialValue="A thoughtful response"
		/>
	),
};

export const NumberInputEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={numberInput}
			field={storyField(numberInput.defaultConfig(), "number-input")}
			initialValue={42}
		/>
	),
};

export const DatePickerEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={datePicker}
			field={storyField(datePicker.defaultConfig(), "date-picker")}
		/>
	),
};

export const DateTimePickerEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={dateTimePicker}
			field={storyField(dateTimePicker.defaultConfig(), "datetime-picker")}
		/>
	),
};

export const TimePickerEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={timePicker}
			field={storyField(timePicker.defaultConfig(), "time-picker")}
		/>
	),
};

export const SingleSelectEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={singleSelect}
			field={storyField(singleSelect.defaultConfig(), "single-select")}
		/>
	),
};

export const MultiSelectEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={multiSelect}
			field={storyField(multiSelect.defaultConfig(), "multi-select")}
		/>
	),
};

export const RadioGroupEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={radioGroup}
			field={storyField(radioGroup.defaultConfig(), "radio-group")}
		/>
	),
};

export const CheckboxEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={checkbox}
			field={storyField(checkbox.defaultConfig(), "checkbox")}
		/>
	),
};

export const SwitchEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={switchField}
			field={storyField(switchField.defaultConfig(), "switch")}
		/>
	),
};

export const SliderEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={slider}
			field={storyField(slider.defaultConfig(), "slider")}
		/>
	),
};

export const RatingEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={rating}
			field={storyField(rating.defaultConfig(), "rating")}
		/>
	),
};

export const FileUploadEditor: Story = {
	render: () => (
		<FieldEditorHarness
			definition={fileUpload}
			field={storyField(fileUpload.defaultConfig(), "file-upload")}
		/>
	),
};
