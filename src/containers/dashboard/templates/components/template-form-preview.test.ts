import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TemplateFormPreview } from "#/containers/dashboard/templates/components/template-form-preview";
import { FORM_TEMPLATES } from "#/containers/dashboard/templates/constants";
import * as fieldHelpers from "#/features/form-builder/utils/helperFunctions";

afterEach(() => vi.restoreAllMocks());

describe("template form preview", () => {
	it.each(
		FORM_TEMPLATES,
	)("uses registered renderers for $title", (template) => {
		const lookup = vi.spyOn(fieldHelpers, "getFieldComponent");
		const markup = renderToStaticMarkup(
			createElement(TemplateFormPreview, { template }),
		);

		expect(lookup.mock.calls.map(([type]) => type)).toEqual(
			template.sections.flatMap((section) =>
				section.fields.map((field) => field.type),
			),
		);
		expect(markup).toContain('type="button"');
		expect(markup).toContain('disabled=""');
		expect(markup).not.toContain("<form");
	});

	it("keeps thumbnail controls out of the interaction order", () => {
		const markup = renderToStaticMarkup(
			createElement(TemplateFormPreview, {
				template: FORM_TEMPLATES[0],
				thumbnail: true,
			}),
		);

		expect(markup).toContain('inert=""');
		expect(markup).toContain('type="email"');
		expect(markup).toContain("<textarea");
	});

	it("uses the real slider defaults rather than a fabricated range", () => {
		const markup = renderToStaticMarkup(
			createElement(TemplateFormPreview, { template: FORM_TEMPLATES[1] }),
		);

		expect(markup).toContain('aria-valuemin="0"');
		expect(markup).toContain('aria-valuemax="100"');
		expect(markup).toContain(">50</span>");
	});

	it("keeps field ids unique when a thumbnail and dialog render together", () => {
		const markup = renderToStaticMarkup(
			createElement(
				Fragment,
				null,
				createElement(TemplateFormPreview, {
					template: FORM_TEMPLATES[0],
					thumbnail: true,
				}),
				createElement(TemplateFormPreview, { template: FORM_TEMPLATES[0] }),
			),
		);
		const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(
			(match) => match[1],
		);

		expect(ids).toHaveLength(8);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(FORM_TEMPLATES)("produces stable markup for $title", (template) => {
		const render = () =>
			renderToStaticMarkup(createElement(TemplateFormPreview, { template }));

		expect(render()).toBe(render());
	});
});
