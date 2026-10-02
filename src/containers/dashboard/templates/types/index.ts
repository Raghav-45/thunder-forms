import type { SliderConfig } from "#/features/form-builder/elements/fields/slider";
import type { AvailableFieldsType } from "#/features/form-builder/types";

export interface TemplateFieldSpec {
	type: AvailableFieldsType;
	label: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	options?: { label: string; value: string }[];
	inputType?: string;
	slider?: Pick<SliderConfig, "min" | "max" | "step" | "defaultValue">;
}

export interface TemplateSectionSpec {
	fields: TemplateFieldSpec[];
}

export interface FormTemplateSpec {
	slug: string;
	title: string;
	description: string;
	category: string;
	submitButtonText?: string;
	/** Representative real questions for thumbnails only; full order is unchanged. */
	previewFieldLabels?: string[];
	sections: TemplateSectionSpec[];
}
