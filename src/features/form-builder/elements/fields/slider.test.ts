import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SliderFieldDefinition } from "#/features/form-builder/elements/fields/slider";

const definition = new SliderFieldDefinition();
const render = (description = "", error?: string, disabled = false) =>
	renderToStaticMarkup(
		createElement(definition.component, {
			field: {
				...definition.defaultConfig(),
				id: "rating",
				label: "Overall experience",
				description,
				disabled,
			},
			value: undefined,
			onChange: () => {},
			error,
		}),
	);

describe("shared slider renderer accessibility", () => {
	it("provides stable question IDs for the mounted thumb association", () => {
		const markup = render();
		const thumb = markup.match(/<span[^>]*role="slider"[^>]*>/)?.[0];
		expect(markup).toContain('id="field-rating-label"');
		expect(markup).toContain("Overall experience</label>");
		expect(markup).toContain('aria-labelledby="field-rating-label"');
		expect(thumb).toContain('aria-valuemin="0"');
		expect(thumb).toContain('aria-valuemax="100"');
		expect(thumb).not.toContain("aria-describedby");
	});

	it("provides stable description and error targets for the mounted thumb", () => {
		const markup = render("Choose a rating.", "Choose a valid rating.");
		expect(markup).toContain(
			'aria-describedby="field-rating-description field-rating-error"',
		);
		expect(markup).toContain('aria-invalid="true"');
		expect(markup).toContain('id="field-rating-description"');
		expect(markup).toContain('id="field-rating-error"');
		expect(markup).toContain('role="alert"');
	});

	it("preserves disabled semantics and the accessible question", () => {
		const markup = render("", undefined, true);
		const thumb = markup.match(/<span[^>]*role="slider"[^>]*>/)?.[0];
		expect(markup).toContain('aria-disabled="true"');
		expect(markup).toContain('aria-labelledby="field-rating-label"');
		expect(thumb).not.toContain('tabindex="0"');
	});
});
