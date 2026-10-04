import { afterEach, describe, expect, it, vi } from "vitest";
import { FORM_TEMPLATES } from "#/containers/dashboard/templates/constants";
import { instantiateTemplate } from "#/containers/dashboard/templates/instantiate-template";
import {
	FILE_UPLOAD_MAX_FILES,
	FILE_UPLOAD_MAX_SIZE_BYTES,
} from "#/features/file-uploads/constants";
import { GeneratedFormResponseValidator } from "#/features/form-builder/core/generated-form";
import {
	getOrderedFormFields,
	isFormStructure,
} from "#/features/form-builder/form-structure";
import { FormValidator } from "#/lib/validators/form";
import { GenerationSession } from "#/routes/api/generatewithai/-generation";

function withoutIds(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(withoutIds);
	if (typeof value !== "object" || value === null) return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== "id")
			.map(([key, entry]) => [key, withoutIds(entry)]),
	);
}

const nameField = {
	uniqueIdentifier: "text-input",
	label: "Name",
	required: true,
};
const answer = (fields: unknown[], extras: Record<string, unknown> = {}) =>
	JSON.stringify({
		title: "Feedback",
		description: "Tell us what you think.",
		fields: { pages: [{ sections: [{ fields }] }] },
		...extras,
	});
const pageAnswer = (pages: unknown, extras: Record<string, unknown> = {}) =>
	JSON.stringify({
		title: "Volunteer signup",
		description: "Join the event team.",
		fields: { pages },
		...extras,
	});

const orderedFields = (body: {
	fields: Parameters<typeof getOrderedFormFields>[0];
}) => getOrderedFormFields(body.fields);

describe("generation trust boundary", () => {
	afterEach(() => vi.unstubAllEnvs());

	it("materializes defaults, assigns fresh IDs, and validates choice options", async () => {
		const response = new GenerationSession().createResponse(
			answer([
				{ ...nameField, id: "repeated" },
				{ uniqueIdentifier: "text-area", label: "Message", id: "repeated" },
				{
					uniqueIdentifier: "single-select",
					label: "Topic",
					options: [{ label: "Product", value: "product" }],
				},
			]),
			Date.now(),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(isFormStructure(body.fields)).toBe(true);
		expect(GeneratedFormResponseValidator.safeParse(body).success).toBe(true);
		expect(FormValidator.safeParse(body).success).toBe(true);
		expect(body).not.toHaveProperty("structure");
		expect(body).not.toHaveProperty("pages");
		const fields = orderedFields(body);
		expect(new Set(fields.map((field) => field.id)).size).toBe(3);
		expect(fields[0]).toMatchObject({
			inputType: "text",
			required: true,
			disabled: false,
			description: "",
		});
		expect(fields[2]).toMatchObject({
			options: [
				{
					id: expect.any(String),
					label: "Product",
					value: "product",
				},
			],
		});
		expect(fields[2]).not.toHaveProperty("type");
	});

	it.each(
		[
			[],
			[null],
			[{ ...nameField, uniqueIdentifier: "invented" }],
			[{ type: "text-input", label: "Name" }],
			[{ ...nameField, type: "text-input" }],
			[{ ...nameField, label: " " }],
			[{ ...nameField, required: "true" }],
			[{ ...nameField, placeholder: {} }],
			[{ ...nameField, pattern: "[" }],
			[{ ...nameField, minLength: 20, maxLength: 5 }],
			[{ ...nameField, minLength: -1 }],
			[{ ...nameField, inputType: "number" }],
			[{ uniqueIdentifier: "slider", label: "Score", min: 10, max: 0 }],
			[
				{
					uniqueIdentifier: "slider",
					label: "Score",
					min: 0,
					max: 10,
					defaultValue: 11,
				},
			],
			[{ uniqueIdentifier: "number-input", label: "Count", step: 0 }],
			[{ uniqueIdentifier: "rating", label: "Stars", maxRating: 100 }],
			[
				{
					uniqueIdentifier: "rating",
					label: "Mood",
					style: "emoji",
					step: 0.5,
				},
			],
			[{ uniqueIdentifier: "time-picker", label: "Time", minuteStep: 17 }],
			[
				{
					uniqueIdentifier: "date-picker",
					label: "Date",
					dateFormat: "YYYY-MM-DD",
				},
			],
			[{ uniqueIdentifier: "file-upload", label: "Resume", maxFiles: -1 }],
			[
				{
					uniqueIdentifier: "file-upload",
					label: "Resume",
					maxFiles: FILE_UPLOAD_MAX_FILES + 1,
				},
			],
			[
				{
					uniqueIdentifier: "file-upload",
					label: "Resume",
					maxSizeBytes: FILE_UPLOAD_MAX_SIZE_BYTES + 1,
				},
			],
			[{ uniqueIdentifier: "single-select", label: "Topic", options: [] }],
			[
				{
					uniqueIdentifier: "single-select",
					label: "Topic",
					options: [{ label: "Missing" }],
				},
			],
			[
				{
					uniqueIdentifier: "single-select",
					label: "Topic",
					options: [
						{ label: "A", value: "a" },
						{ label: "B", value: "a" },
					],
				},
			],
		].map((fields) => ({ fields })),
	)("rejects invalid generated fields: $fields", ({ fields }) => {
		expect(
			new GenerationSession().createResponse(answer(fields), Date.now()).status,
		).toBe(502);
	});

	it("clamps and snaps an inherited slider default when its range changes", async () => {
		const response = new GenerationSession().createResponse(
			answer([
				{
					uniqueIdentifier: "slider",
					label: "Score",
					min: 0,
					max: 10,
					step: 3,
				},
			]),
			Date.now(),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(orderedFields(body)[0]).toMatchObject({
			min: 0,
			max: 10,
			step: 3,
			defaultValue: 9,
		});
	});

	it("materializes requested page and section hierarchy with fresh stable IDs", async () => {
		const response = new GenerationSession().createResponse(
			pageAnswer([
				{
					title: "About you",
					description: "Contact details.",
					sections: [
						{
							title: "Identity",
							fields: [{ ...nameField, id: "untrusted-id" }],
						},
					],
				},
				{
					title: "Availability",
					sections: [
						{
							title: "Schedule",
							fields: [
								{
									uniqueIdentifier: "single-select",
									label: "Preferred shift",
									options: [
										{ label: "Morning", value: "morning" },
										{ label: "Evening", value: "evening" },
									],
								},
							],
						},
					],
				},
			]),
			Date.now(),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.fields.pages).toHaveLength(2);
		expect(
			body.fields.pages.map((page: { title: string }) => page.title),
		).toEqual(["About you", "Availability"]);
		expect(body.fields.pages[0].sections[0].title).toBe("Identity");
		expect(body.fields.pages[1].sections[0].title).toBe("Schedule");
		expect(orderedFields(body).map((field) => field.label)).toEqual([
			"Name",
			"Preferred shift",
		]);
		expect(orderedFields(body)[0].id).not.toBe("untrusted-id");
		expect(isFormStructure(body.fields)).toBe(true);
	});

	it.each(
		[
			[],
			[{ sections: [] }],
			[{ title: 1, sections: [{ fields: [nameField] }] }],
			[{ sections: [{ title: {}, fields: [nameField] }] }],
			[{ sections: [{ fields: [] }] }],
			[{ fields: [nameField], sections: [{ fields: [nameField] }] }],
			[
				{
					sections: [{ pages: [{ fields: [nameField] }], fields: [nameField] }],
				},
			],
		].map((pages) => ({ pages })),
	)("rejects invalid generated page structure: $pages", ({ pages }) => {
		expect(
			new GenerationSession().createResponse(pageAnswer(pages), Date.now())
				.status,
		).toBe(502);
	});

	it.each([
		{ title: "Feedback", fields: [nameField] },
		{ title: "Feedback", pages: [{ sections: [{ fields: [nameField] }] }] },
		{
			title: "Feedback",
			structure: { pages: [{ sections: [{ fields: [nameField] }] }] },
		},
	])("rejects obsolete envelopes without adapting them: %j", (form) => {
		expect(
			new GenerationSession().createResponse(JSON.stringify(form), Date.now())
				.status,
		).toBe(502);
	});

	it.each([
		{ pages: [] },
		{ structure: {} },
	])("rejects obsolete properties alongside the canonical envelope: %j", (extras) => {
		expect(
			new GenerationSession().createResponse(
				answer([nameField], extras),
				Date.now(),
			).status,
		).toBe(502);
	});

	it.each([
		`\u0060\u0060\u0060json\n${answer([nameField])}\n\u0060\u0060\u0060`,
		`Here is your form: ${answer([nameField])}`,
		`${answer([nameField])}\nYour form is ready.`,
	])("rejects prose-wrapped JSON without extracting it", (text) => {
		expect(
			new GenerationSession().createResponse(text, Date.now()).status,
		).toBe(502);
	});

	it("preserves nullable save metadata and canonical structure settings", async () => {
		const response = new GenerationSession().createResponse(
			answer([nameField], {
				description: null,
				submitButtonText: null,
				fields: {
					pages: [{ sections: [{ fields: [nameField] }] }],
					layout: { contentWidth: "wide" },
				},
			}),
			Date.now(),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toMatchObject({
			description: null,
			submitButtonText: null,
			fields: { layout: { contentWidth: "wide" } },
		});
		expect(GeneratedFormResponseValidator.safeParse(body).success).toBe(true);
	});

	it("keeps invalid model JSON out of responses except truncated development diagnostics", async () => {
		vi.stubEnv("NODE_ENV", "production");
		const response = new GenerationSession().createResponse(
			"bad model output",
			Date.now(),
		);
		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({
			error: "AI returned invalid JSON",
		});
		vi.stubEnv("NODE_ENV", "development");
		const dev = new GenerationSession().createResponse(
			"x".repeat(5000),
			Date.now(),
		);
		expect((await dev.json()).raw).toHaveLength(4000);
	});

	it.each([
		null,
		{ title: "", fields: { pages: [{ sections: [{ fields: [nameField] }] }] } },
		{
			title: "A",
			fields: { pages: [{ sections: [{ fields: [nameField] }] }] },
		},
		{
			title: "  ",
			fields: { pages: [{ sections: [{ fields: [nameField] }] }] },
		},
		{
			title: "Feedback",
			description: {},
			fields: { pages: [{ sections: [{ fields: [nameField] }] }] },
		},
		{
			title: "Feedback",
			submitButtonText: "x".repeat(51),
			fields: { pages: [{ sections: [{ fields: [nameField] }] }] },
		},
	])("rejects malformed form metadata: %j", (form) => {
		expect(
			new GenerationSession().createResponse(JSON.stringify(form), Date.now())
				.status,
		).toBe(502);
	});
});

describe("template generation", () => {
	it.each(
		FORM_TEMPLATES,
	)("returns canonical $title without a model echo", async (template) => {
		const session = new GenerationSession();
		const tool = session.executeToolCall("get_template", {
			slug: template.slug,
			useAsIs: true,
		});
		const response = session.getDirectTemplateResponse(1, Date.now(), {
			inputTokens: 30,
			outputTokens: 10,
		});
		expect(response?.status).toBe(200);
		const body = await response?.json();
		const canonical = instantiateTemplate(template);
		expect(isFormStructure(body.fields)).toBe(true);
		expect(withoutIds(body.fields)).toEqual(withoutIds(canonical));
		expect(withoutIds(orderedFields(body))).toEqual(
			withoutIds(getOrderedFormFields(canonical)),
		);
		expect(body.title).toBe(template.title);
		expect(body.description).toBe(template.description);
		expect(body.submitButtonText).toBe(template.submitButtonText);
		expect(body.meta.usage).toEqual({ inputTokens: 30, outputTokens: 10 });
		expect((tool.fields as { pages: unknown[] }).pages).toHaveLength(
			canonical.pages.length,
		);
	});

	it("preserves every original question and section when adding seven fields", async () => {
		const session = new GenerationSession();
		const template = FORM_TEMPLATES.find(
			(entry) => entry.slug === "customer-feedback",
		);
		if (!template) throw new Error("Customer Feedback template is missing");
		session.executeToolCall("get_template", {
			slug: template.slug,
			useAsIs: false,
		});
		expect(session.getDirectTemplateResponse(1, Date.now())).toBeUndefined();
		session.executeToolCall("get_template", {
			slug: template.slug,
			useAsIs: true,
		});
		const baselineResponse = session.getDirectTemplateResponse(1, Date.now());
		expect(baselineResponse?.status).toBe(200);
		const baseline = await baselineResponse?.json();
		const additions = Array.from({ length: 7 }, (_, index) => ({
			...nameField,
			label: `Extra question ${index + 1}`,
		}));
		const response = session.createResponse(
			JSON.stringify({
				templateSlug: template.slug,
				fields: {
					pages: [
						{
							title: "Additional feedback",
							sections: [{ title: "Extra questions", fields: additions }],
						},
					],
				},
			}),
			Date.now(),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		const originals = orderedFields(baseline);
		const fields = orderedFields(body);
		expect(fields).toHaveLength(originals.length + 7);
		expect(fields.slice(0, originals.length)).toEqual(originals);
		expect(body.title).toBe(template.title);
		expect(body.submitButtonText).toBe(template.submitButtonText);
		expect(isFormStructure(body.fields)).toBe(true);
		expect(body.fields.pages).toHaveLength(baseline.fields.pages.length + 1);
		expect(
			fields.find(
				(field: { uniqueIdentifier: string }) =>
					field.uniqueIdentifier === "slider",
			),
		).toMatchObject({ min: 0, max: 10, step: 1, defaultValue: 5 });
		// The base remains unchanged if this session is used again.
		expect(
			(
				session.executeToolCall("get_template", { slug: template.slug })
					.fields as { pages: unknown[] }
			).pages.length,
		).toBe(baseline.fields.pages.length);
	});

	it("returns errors for unknown templates and prevents cross-request reuse", () => {
		const session = new GenerationSession();
		expect(
			session.executeToolCall("get_template", {
				slug: "missing",
				useAsIs: true,
			}),
		).toHaveProperty("error");
		expect(session.getDirectTemplateResponse(1, Date.now())).toBeUndefined();
		expect(
			new GenerationSession().createResponse(
				JSON.stringify({
					templateSlug: FORM_TEMPLATES[0].slug,
					fields: { pages: [] },
				}),
				Date.now(),
			).status,
		).toBe(502);
	});

	it("does not finish an entire batch when additional tools were requested", () => {
		const session = new GenerationSession();
		session.executeToolCall("get_text_input_spec");
		session.executeToolCall("get_template", {
			slug: FORM_TEMPLATES[0].slug,
			useAsIs: true,
		});
		expect(session.getDirectTemplateResponse(2, Date.now())).toBeUndefined();
	});
});
