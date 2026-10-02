import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	countTemplateFields,
	FORM_TEMPLATES,
	getTemplateBySlug,
} from "#/containers/dashboard/templates/constants";
import { instantiateTemplate } from "#/containers/dashboard/templates/instantiate-template";
import type { FormTemplateSpec } from "#/containers/dashboard/templates/types";
import { SliderFieldDefinition } from "#/features/form-builder/elements/fields/slider";
import { isFormStructure } from "#/features/form-builder/form-structure";

const allIds = (template: ReturnType<typeof instantiateTemplate>) => [
	...template.pages.map((page) => page.id),
	...template.pages.flatMap((page) =>
		page.sections.map((section) => section.id),
	),
	...template.pages.flatMap((page) =>
		page.sections.flatMap((section) => section.fields.map((field) => field.id)),
	),
];

describe("template catalog", () => {
	it.each(
		FORM_TEMPLATES,
	)("references existing, unique thumbnail questions for $title", (template) => {
		const labels = template.sections.flatMap((section) =>
			section.fields.map((field) => field.label),
		);
		for (const label of template.previewFieldLabels ?? []) {
			expect(labels.filter((candidate) => candidate === label)).toHaveLength(1);
		}
	});
	it.each(FORM_TEMPLATES)("finds %s by slug", (template) => {
		expect(getTemplateBySlug(template.slug)).toBe(template);
	});

	it("returns undefined for an unknown template slug", () => {
		expect(getTemplateBySlug("missing-template")).toBeUndefined();
	});

	it.each(FORM_TEMPLATES)("counts fields in %s", (template) => {
		const expectedCount = template.sections.flatMap(
			(section) => section.fields,
		).length;

		expect(countTemplateFields(template)).toBe(expectedCount);
	});
});

describe("instantiateTemplate", () => {
	beforeEach(() => {
		let nextId = 0;
		vi.stubGlobal("crypto", {
			randomUUID: () => `${String(nextId++).padStart(8, "0")}-uuid`,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each(
		FORM_TEMPLATES,
	)("does not inherit unrelated helper descriptions for $title", (template) => {
		const specs = template.sections.flatMap((section) => section.fields);
		const fields = instantiateTemplate(template).pages.flatMap((page) =>
			page.sections.flatMap((section) => section.fields),
		);
		expect(fields.map((field) => field.description)).toEqual(
			specs.map((spec) => spec.description ?? ""),
		);
	});

	it("gives the builder and validator the same 0–10 feedback scale", () => {
		const template = getTemplateBySlug("customer-feedback");
		expect(template).toBeDefined();
		if (!template) throw new Error("Missing feedback template");
		const field = instantiateTemplate(
			template,
		).pages[0].sections[0].fields.find(
			(field) => field.uniqueIdentifier === "slider",
		);
		if (!field || field.uniqueIdentifier !== "slider")
			throw new Error("Missing feedback slider");
		expect(field).toMatchObject({ min: 0, max: 10, step: 1, defaultValue: 5 });
		const schema = new SliderFieldDefinition().getValidationSchema(field);
		for (const value of [0, 5, 10])
			expect(schema.safeParse(value).success).toBe(true);
		for (const value of [-1, 0.5, 11])
			expect(schema.safeParse(value).success).toBe(false);
	});

	it("preserves zero slider overrides without changing registry defaults", () => {
		const template: FormTemplateSpec = {
			slug: "zero-slider",
			title: "Zero slider",
			description: "",
			category: "Test",
			sections: [
				{
					fields: [
						{
							type: "slider",
							label: "Rating",
							slider: { min: 0, max: 10, defaultValue: 0 },
						},
					],
				},
			],
		};
		expect(
			instantiateTemplate(template).pages[0].sections[0].fields[0],
		).toMatchObject({ min: 0, max: 10, defaultValue: 0, step: 1 });
		expect(new SliderFieldDefinition().defaultConfig()).toMatchObject({
			min: 0,
			max: 100,
			defaultValue: 50,
		});
	});

	it.each([
		{ slider: { max: 10 }, expected: 10 },
		{ slider: { min: 80 }, expected: 80 },
		{ slider: { step: 30 }, expected: 60 },
		{ slider: { min: 3, step: 7 }, expected: 52 },
		{ slider: { max: 10, step: 3 }, expected: 9 },
		{ slider: { min: 0.1, max: 0.3, step: 0.1 }, expected: 0.3 },
		{ slider: { min: -10, max: -1, step: 2 }, expected: -2 },
		{ slider: { max: 4, step: 10 }, expected: 0 },
		{ slider: { step: 2 }, expected: 50 },
		{ slider: { max: 1.2, step: 0.25 }, expected: 1 },
	])("normalizes inherited defaults for partial overrides $slider", ({
		slider,
		expected,
	}) => {
		const template: FormTemplateSpec = {
			slug: "partial-slider",
			title: "Partial slider",
			description: "",
			category: "Test",
			sections: [{ fields: [{ type: "slider", label: "Rating", slider }] }],
		};
		const field = instantiateTemplate(template).pages[0].sections[0].fields[0];
		if (field.uniqueIdentifier !== "slider") throw new Error("Missing slider");
		expect(field.defaultValue).toBe(expected);
		expect(
			new SliderFieldDefinition()
				.getValidationSchema(field)
				.safeParse(field.defaultValue).success,
		).toBe(true);
		expect(template.sections[0].fields[0].slider).toEqual(slider);
		expect(template.sections[0].fields[0].slider?.defaultValue).toBeUndefined();
	});

	it.each([
		{ min: 10, max: 0 },
		{ max: Number.NaN },
		{ step: 0 },
		{ step: Number.POSITIVE_INFINITY },
		{ max: 10, defaultValue: 50 },
		{ max: 10, step: 3, defaultValue: 5 },
	])("rejects invalid explicit slider configuration $slider", (slider) => {
		const template: FormTemplateSpec = {
			slug: "invalid-slider",
			title: "Invalid slider",
			description: "",
			category: "Test",
			sections: [{ fields: [{ type: "slider", label: "Rating", slider }] }],
		};
		expect(() => instantiateTemplate(template)).toThrow(
			/Invalid slider (constraints|default) for "Rating"/,
		);
	});

	it.each(FORM_TEMPLATES)("creates valid form structure for %s", (template) => {
		expect(isFormStructure(instantiateTemplate(template))).toBe(true);
	});

	it("assigns unique ids to two instances of same template", () => {
		const template = FORM_TEMPLATES[0];
		const first = instantiateTemplate(template);
		const second = instantiateTemplate(template);

		expect(new Set(allIds(first)).size).toBe(allIds(first).length);
		expect(new Set(allIds(second)).size).toBe(allIds(second).length);
		expect(allIds(first).some((id) => allIds(second).includes(id))).toBe(false);
	});

	it("preserves presentation overrides allowed by template spec", () => {
		const template: FormTemplateSpec = {
			slug: "test-template",
			title: "Test template",
			description: "Description",
			category: "Test",
			sections: [
				{
					fields: [
						{
							type: "single-select",
							label: "Priority",
							placeholder: "Choose priority",
							description: "Pick one",
							required: true,
							options: [{ label: "High", value: "high" }],
						},
					],
				},
			],
		};

		const field = instantiateTemplate(template).pages[0].sections[0].fields[0];

		expect(field).toMatchObject({
			uniqueIdentifier: "single-select",
			label: "Priority",
			placeholder: "Choose priority",
			description: "Pick one",
			required: true,
			options: [{ label: "High", value: "high" }],
		});
	});
});
