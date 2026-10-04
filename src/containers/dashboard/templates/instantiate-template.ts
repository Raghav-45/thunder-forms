import type { FormTemplateSpec } from "#/containers/dashboard/templates/types";
import type { FieldConfig } from "#/features/form-builder/elements";
import { normalizeChoiceOptions } from "#/features/form-builder/elements/choice-options";
import type { SliderConfig } from "#/features/form-builder/elements/fields/slider";
import {
	clampSliderDefaultValue,
	isOnStep,
	isPositiveFiniteNumber,
} from "#/features/form-builder/elements/number-constraints";
import {
	createFormPage,
	createFormSection,
	type FormSection,
	type FormStructure,
} from "#/features/form-builder/form-structure";
import type { AvailableFieldsType } from "#/features/form-builder/types";
import { createDefaultFieldConfig } from "#/features/form-builder/utils/helperFunctions";

export type BuiltSection = FormSection;
export type BuiltFormStructure = FormStructure;

/**
 * Materialize a template spec into builder-ready form structure.
 *
 * Every section and field gets a fresh UUID so template instances never
 * collide with each other (or with fields the user adds afterwards).
 * Field shapes always come from the registry's own `defaultConfig`, with
 * explicit copy and supported constraint overrides applied from the spec.
 */
export function instantiateTemplate(template: FormTemplateSpec): FormStructure {
	return {
		pages: [
			createFormPage(
				template.sections.map((section) =>
					createFormSection(
						section.fields.map((spec) => {
							const field = createDefaultFieldConfig(
								spec.type as AvailableFieldsType,
							) as unknown as Record<string, unknown>;

							field.id = `${spec.type}_${crypto.randomUUID().slice(0, 8)}`;
							field.label = spec.label;
							if (spec.placeholder !== undefined) {
								field.placeholder = spec.placeholder;
							}
							// Generic field help may describe a different question or workflow.
							field.description = spec.description ?? "";
							if (spec.required !== undefined) {
								field.required = spec.required;
							}
							if (spec.options !== undefined && "options" in field) {
								field.options = normalizeChoiceOptions(spec.options);
							}
							if (spec.inputType !== undefined && "inputType" in field) {
								field.inputType = spec.inputType;
							}
							if (spec.type === "slider" && spec.slider) {
								for (const key of [
									"min",
									"max",
									"step",
									"defaultValue",
								] as const) {
									if (spec.slider[key] !== undefined) {
										field[key] = spec.slider[key];
									}
								}
								const slider = field as unknown as SliderConfig;
								const min = slider.min ?? 0;
								const max = slider.max ?? 100;
								const step = slider.step ?? 1;
								if (
									!Number.isFinite(min) ||
									!Number.isFinite(max) ||
									min > max ||
									!isPositiveFiniteNumber(step)
								) {
									throw new Error(
										`Invalid slider constraints for "${spec.label}".`,
									);
								}
								if (spec.slider.defaultValue === undefined) {
									// Only adjust inherited defaults; explicit answers must stay intentional.
									slider.defaultValue = clampSliderDefaultValue(
										slider.defaultValue ?? min,
										min,
										max,
										step,
									);
								}
								const initialValue = slider.defaultValue ?? min;
								if (
									!Number.isFinite(initialValue) ||
									initialValue < min ||
									initialValue > max ||
									!isOnStep(initialValue, step, min)
								) {
									throw new Error(
										`Invalid slider default for "${spec.label}".`,
									);
								}
							}

							return field as unknown as FieldConfig;
						}),
					),
				),
			),
		],
	};
}
