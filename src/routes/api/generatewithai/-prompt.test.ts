import { describe, expect, it } from "vitest";

import {
	isFormStructure,
	isKnownFieldIdentifier,
} from "#/features/form-builder/form-structure";
import {
	FIELD_TOOL_SPECS,
	GET_FIELD_SPEC_TOOLS,
	GET_TEMPLATE_TOOLS,
	resolveFieldSpec,
	resolveTemplate,
	resolveTemplateList,
	SYSTEM_PROMPT,
} from "#/routes/api/generatewithai/-prompt";

const KNOWN_IDENTIFIERS = [
	"text-input",
	"multi-select",
	"text-area",
	"switch-field",
	"date-picker",
	"checkbox",
	"number-input",
	"single-select",
	"radio-group",
	"slider",
	"datetime-picker",
	"file-upload",
	"time-picker",
	"rating",
];

const TOOL_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

describe("generate-with-ai prompt", () => {
	it("covers every known field type with exactly one tool", () => {
		// Tripwire: adding a field identifier to the server allow-list must add
		// a tool entry here too (see -prompt.ts header note).
		expect(Object.keys(FIELD_TOOL_SPECS).sort()).toEqual(
			[...KNOWN_IDENTIFIERS].sort(),
		);
		expect(GET_FIELD_SPEC_TOOLS).toHaveLength(KNOWN_IDENTIFIERS.length);
		for (const identifier of KNOWN_IDENTIFIERS) {
			expect(isKnownFieldIdentifier(identifier)).toBe(true);
		}
	});

	it("keeps the system prompt generic with no field identifiers", () => {
		expect(SYSTEM_PROMPT.length).toBeLessThan(3000);
		for (const identifier of KNOWN_IDENTIFIERS) {
			expect(SYSTEM_PROMPT).not.toContain(identifier);
		}
	});

	it("declares valid self-describing tools with specs naming their identifier", () => {
		const names = GET_FIELD_SPEC_TOOLS.map((tool) => tool.name).filter(
			(name): name is string => typeof name === "string",
		);
		expect(names).toHaveLength(GET_FIELD_SPEC_TOOLS.length);
		for (const tool of GET_FIELD_SPEC_TOOLS) {
			expect(tool.name).toMatch(TOOL_NAME_PATTERN);
			expect(tool.description?.length).toBeGreaterThan(0);
		}
		for (const name of names) {
			expect(name.length).toBeLessThanOrEqual(64);
		}
		expect(new Set(names).size).toBe(names.length);
		for (const identifier of KNOWN_IDENTIFIERS) {
			const field = FIELD_TOOL_SPECS[identifier];
			expect(field.description.length).toBeGreaterThan(0);
			expect(field.spec).toContain(`'${identifier}'`);
			expect(names.includes(field.toolName)).toBe(true);
		}
	});

	it("resolves known tools and reports unknown ones without throwing", () => {
		expect(resolveFieldSpec("get_text_input_spec")).toEqual({
			uniqueIdentifier: "text-input",
			spec: expect.stringContaining(FIELD_TOOL_SPECS["text-input"].spec),
		});
		expect(resolveFieldSpec("nope")).toMatchObject({
			error: expect.any(String),
		});
		expect(resolveFieldSpec(undefined)).toMatchObject({
			error: expect.any(String),
		});
	});

	it("declares list_templates and get_template with valid names", () => {
		const names = GET_TEMPLATE_TOOLS.map((tool) => tool.name);
		expect(names.sort()).toEqual(["get_template", "list_templates"]);
		for (const tool of GET_TEMPLATE_TOOLS) {
			expect(tool.name).toMatch(TOOL_NAME_PATTERN);
			expect(tool.description?.length).toBeGreaterThan(0);
		}
		expect(new Set(names).size).toBe(names.length);
		const getTool = GET_TEMPLATE_TOOLS.find(
			(tool) => tool.name === "get_template",
		);
		expect(getTool?.parameters?.required).toContain("slug");
	});

	it("lists every template with slugs and field counts", () => {
		const listed = resolveTemplateList() as {
			templates: {
				category: string;
				description: string;
				fieldCount: number;
				slug: string;
				title: string;
			}[];
		};
		expect(listed.templates.length).toBeGreaterThan(0);
		for (const template of listed.templates) {
			expect(template.slug.length).toBeGreaterThan(0);
			expect(template.title.length).toBeGreaterThan(0);
			expect(template.fieldCount).toBeGreaterThan(0);
		}
		expect(new Set(listed.templates.map((t) => t.slug)).size).toBe(
			listed.templates.length,
		);
	});

	it("resolves templates by slug, case-insensitively, or errors", () => {
		const { slug } = (
			resolveTemplateList() as { templates: { slug: string }[] }
		).templates[0];
		const fetched = resolveTemplate({ slug }) as {
			fields: unknown;
			title: string;
		};
		expect(fetched.title.length).toBeGreaterThan(0);
		expect(isFormStructure(fetched.fields)).toBe(true);
		expect(resolveTemplate({ slug: slug.toUpperCase() })).toMatchObject({
			title: fetched.title,
		});
		expect(resolveTemplate({ slug: "no-such-template" })).toMatchObject({
			error: expect.any(String),
		});
		expect(resolveTemplate({})).toMatchObject({ error: expect.any(String) });
		expect(resolveTemplate(null)).toMatchObject({ error: expect.any(String) });
	});

	it("mentions templates in the prompt without naming field types", () => {
		expect(SYSTEM_PROMPT).toContain("template");
	});

	it("includes useful copy guidance without requiring boilerplate", () => {
		expect(SYSTEM_PROMPT).toContain("placeholder");
		expect(SYSTEM_PROMPT).toContain("description");
	});
});
