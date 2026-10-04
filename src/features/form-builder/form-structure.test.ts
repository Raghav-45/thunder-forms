import { describe, expect, it } from "vitest";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	createFormStructure,
	type FormStructure,
	getOrderedFormFields,
	isFormStructure,
	normalizeFormLayout,
	sanitizeImportedFields,
	stripQuizAnswerKeys,
} from "#/features/form-builder/form-structure";

const field = (id: string): FieldConfig =>
	({
		id,
		label: id,
		uniqueIdentifier: "text-input",
	}) as FieldConfig;

const structure = (pages: FormStructure["pages"]): FormStructure => ({ pages });

describe("form structure", () => {
	it("creates one page and one section for imported fields", () => {
		const ids = ["section-id", "page-id"];
		const form = createFormStructure([field("field-id")], () => ids.shift()!);

		expect(form).toEqual({
			pages: [
				{
					id: "page-id",
					sections: [{ id: "section-id", fields: [field("field-id")] }],
				},
			],
		});
	});

	it("accepts a canonical multi-page tree and preserves authoring order", () => {
		const form = structure([
			{
				id: "page-a",
				sections: [
					{ id: "section-a", fields: [field("field-a"), field("field-b")] },
					{ id: "section-b", fields: [field("field-c")] },
				],
			},
			{
				id: "page-b",
				sections: [{ id: "section-c", fields: [field("field-d")] }],
			},
		]);

		expect(isFormStructure(form)).toBe(true);
		expect(getOrderedFormFields(form).map((item) => item.id)).toEqual([
			"field-a",
			"field-b",
			"field-c",
			"field-d",
		]);
	});

	it("accepts optional section titles and descriptions", () => {
		expect(
			isFormStructure({
				pages: [
					{
						id: "page",
						sections: [
							{
								id: "section",
								title: "About you",
								description: "Tell us about yourself.",
								fields: [field("field")],
							},
						],
					},
				],
			}),
		).toBe(true);
	});

	it("accepts saved layout preferences and rejects unsupported values", () => {
		const pages = [
			{
				id: "page",
				sections: [{ id: "section", fields: [field("field")] }],
			},
		];
		expect(
			isFormStructure({
				pages,
				layout: {
					contentAlignment: "left",
					headerAlignment: "center",
					contentWidth: "wide",
					sectionSpacing: "spacious",
					spacing: { fieldGap: 7, submitGap: 9 },
					submitAlignment: "right",
				},
			}),
		).toBe(true);
		expect(
			isFormStructure({ pages, layout: { headerAlignment: "right" } }),
		).toBe(false);
		expect(
			isFormStructure({ pages, layout: { sectionSpacing: "roomy" } }),
		).toBe(false);
		expect(
			isFormStructure({ pages, layout: { spacing: { fieldGap: 17 } } }),
		).toBe(false);
	});

	it("validates submit widths and retains responsive buttons for older forms", () => {
		const pages = [
			{ id: "page", sections: [{ id: "section", fields: [field("field")] }] },
		];
		for (const submitWidth of ["auto", "full", "responsive"]) {
			expect(isFormStructure({ pages, layout: { submitWidth } })).toBe(true);
		}
		for (const submitWidth of ["wide", "", 100, null]) {
			expect(isFormStructure({ pages, layout: { submitWidth } })).toBe(false);
		}
		expect(normalizeFormLayout().submitWidth).toBe("responsive");
		expect(normalizeFormLayout({ submitAlignment: "right" }).submitWidth).toBe(
			"responsive",
		);
	});

	it("accepts registered file-upload fields", () => {
		expect(
			isFormStructure({
				pages: [
					{
						id: "page",
						sections: [
							{
								id: "section",
								fields: [
									{
										id: "portfolio",
										label: "Portfolio",
										uniqueIdentifier: "file-upload",
									},
								],
							},
						],
					},
				],
			}),
		).toBe(true);
	});

	it("rejects section metadata that is not text", () => {
		expect(
			isFormStructure({
				pages: [
					{
						id: "page",
						sections: [{ id: "section", title: 1, fields: [] }],
					},
				],
			}),
		).toBe(false);
	});

	it("rejects an empty page list before builder state can dereference it", () => {
		expect(isFormStructure({ pages: [] })).toBe(false);
	});

	it("rejects malformed, duplicate, and unknown field identities", () => {
		expect(
			isFormStructure({
				pages: [{ id: "page", sections: [{ id: "section", fields: [] }] }],
			}),
		).toBe(true);

		expect(
			isFormStructure({
				pages: [
					{ id: "page", sections: [] },
					{ id: "page", sections: [] },
				],
			}),
		).toBe(false);

		expect(
			isFormStructure({
				pages: [
					{
						id: "page",
						sections: [
							{
								id: "section",
								fields: [{ ...field("field"), uniqueIdentifier: "unknown" }],
							},
						],
					},
				],
			}),
		).toBe(false);

		expect(
			isFormStructure({
				pages: [
					{ id: "page", sections: [{ id: "section", fields: ["field"] }] },
				],
			}),
		).toBe(false);
	});

	it("rejects choice options without unique nonblank values and IDs", () => {
		const validChoiceField = {
			id: "field",
			label: "Choose one",
			uniqueIdentifier: "single-select",
			options: [
				{ id: "option-a", label: "A", value: "a" },
				{ id: "option-b", label: "B", value: "b" },
			],
		};
		const withOptions = (options: unknown) => ({
			pages: [
				{
					id: "page",
					sections: [
						{ id: "section", fields: [{ ...validChoiceField, options }] },
					],
				},
			],
		});

		expect(isFormStructure(withOptions(validChoiceField.options))).toBe(true);
		expect(
			isFormStructure(
				withOptions([
					{ id: "option-a", label: "A", value: "same" },
					{ id: "option-b", label: "B", value: "same" },
				]),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withOptions([{ id: "option-a", label: "A", value: " " }]),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withOptions([
					{ id: "option-a", label: "A", value: "a" },
					{ id: "option-a", label: "B", value: "b" },
				]),
			),
		).toBe(false);
	});

	it("rejects invalid cross-field constraints before they reach the API", () => {
		const withField = (field: Record<string, unknown>) => ({
			pages: [{ id: "page", sections: [{ id: "section", fields: [field] }] }],
		});

		expect(
			isFormStructure(
				withField({
					id: "slider",
					label: "Slider",
					uniqueIdentifier: "slider",
					min: 10,
					max: 1,
					step: 0,
					defaultValue: 99,
				}),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withField({
					id: "number",
					label: "Number",
					uniqueIdentifier: "number-input",
					min: 10,
					max: 1,
				}),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withField({
					id: "choices",
					label: "Choices",
					uniqueIdentifier: "multi-select",
					options: [{ id: "choice", label: "Choice", value: "choice" }],
					minSelections: 2,
					maxSelections: 1,
				}),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withField({
					id: "date",
					label: "Date",
					uniqueIdentifier: "date-picker",
					minDate: "2030-01-01T00:00:00.000Z",
					maxDate: "2020-01-01T00:00:00.000Z",
				}),
			),
		).toBe(false);
		expect(
			isFormStructure(
				withField({
					id: "datetime",
					label: "Date and time",
					uniqueIdentifier: "datetime-picker",
					minDateTime: "2030-01-01T00:00:00.000Z",
					maxDateTime: "2020-01-01T00:00:00.000Z",
				}),
			),
		).toBe(false);
	});

	it("accepts valid quiz answer keys and removes them from public form data", () => {
		const quizStructure = {
			quiz: { enabled: true },
			pages: [
				{
					id: "page",
					sections: [
						{
							id: "section",
							fields: [
								{
									id: "field",
									label: "Choose one",
									uniqueIdentifier: "single-select",
									options: [
										{ id: "option-a", label: "A", value: "a" },
										{ id: "option-b", label: "B", value: "b" },
									],
									quiz: { correctAnswers: ["a"], points: 2 },
								},
							],
						},
					],
				},
			],
		};

		expect(isFormStructure(quizStructure)).toBe(true);
		expect(
			JSON.stringify(stripQuizAnswerKeys(quizStructure as FormStructure)),
		).not.toContain("correctAnswers");
	});

	it("supports manual points for every question type and text answer keys only for text fields", () => {
		const manualQuestion = {
			quiz: { enabled: true },
			pages: [
				{
					id: "page",
					sections: [
						{
							id: "section",
							fields: [
								{
									id: "essay",
									label: "Explain",
									uniqueIdentifier: "text-area",
									quiz: { points: 4 },
								},
							],
						},
					],
				},
			],
		};

		expect(isFormStructure(manualQuestion)).toBe(true);
		expect(
			isFormStructure({
				...manualQuestion,
				pages: [
					{
						...manualQuestion.pages[0],
						sections: [
							{
								...manualQuestion.pages[0].sections[0],
								fields: [
									{
										id: "email",
										label: "Email",
										uniqueIdentifier: "text-input",
										inputType: "email",
										quiz: {
											correctAnswers: ["student@example.com"],
											points: 1,
										},
									},
								],
							},
						],
					},
				],
			}),
		).toBe(false);
	});

	it("accepts quiz release and default-point settings", () => {
		expect(
			isFormStructure({
				quiz: {
					enabled: true,
					gradeRelease: "after-review",
					defaultPoints: 3,
					recipientEmailFieldId: "email",
				},
				pages: [{ id: "page", sections: [{ id: "section", fields: [] }] }],
			}),
		).toBe(true);

		expect(
			isFormStructure({
				quiz: { enabled: true, gradeRelease: "later", defaultPoints: 0 },
				pages: [{ id: "page", sections: [{ id: "section", fields: [] }] }],
			}),
		).toBe(false);
	});

	it("rejects missing collections and every kind of duplicate identifier", () => {
		expect(isFormStructure(null)).toBe(false);
		expect(isFormStructure({ pages: "not-an-array" })).toBe(false);
		expect(
			isFormStructure({ pages: [{ id: "page", sections: "not-an-array" }] }),
		).toBe(false);
		expect(
			isFormStructure({
				pages: [
					{ id: "page", sections: [{ id: "section", fields: "not-an-array" }] },
				],
			}),
		).toBe(false);

		expect(
			isFormStructure({
				pages: [
					{
						id: "page",
						sections: [
							{ id: "section", fields: [field("field"), field("field")] },
						],
					},
				],
			}),
		).toBe(false);
		expect(
			isFormStructure({
				pages: [{ id: "page", sections: [{ id: "page", fields: [] }] }],
			}),
		).toBe(false);
	});
});

describe("sanitizeImportedFields", () => {
	it("drops unknown types and repairs missing or duplicate ids", () => {
		const result = sanitizeImportedFields([
			field("keep"),
			{ ...field("keep"), label: "duplicate id" },
			{ ...field(""), label: "missing id" },
			{ id: "bad", label: "bad", uniqueIdentifier: "unknown" },
			"not-an-object",
			null,
		]);

		expect(result).toHaveLength(3);
		expect(result[0].id).toBe("keep");
		expect(new Set(result.map((item) => item.id)).size).toBe(3);
		expect(
			result.every((item) =>
				isFormStructure({
					pages: [
						{ id: "page", sections: [{ id: "section", fields: [item] }] },
					],
				}),
			),
		).toBe(true);
	});

	it("returns an empty list for non-array payloads", () => {
		expect(sanitizeImportedFields(undefined)).toEqual([]);
		expect(sanitizeImportedFields({})).toEqual([]);
		expect(sanitizeImportedFields("fields")).toEqual([]);
	});
});
