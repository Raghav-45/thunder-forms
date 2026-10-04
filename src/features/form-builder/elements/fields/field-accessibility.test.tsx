import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FileUploadFieldDefinition } from "#/features/form-builder/elements/fields/file-upload";
import { MultiSelectFieldDefinition } from "#/features/form-builder/elements/fields/multi-select";
import { RadioGroupFieldDefinition } from "#/features/form-builder/elements/fields/radio-group";
import { RatingFieldDefinition } from "#/features/form-builder/elements/fields/rating";
import { SingleSelectFieldDefinition } from "#/features/form-builder/elements/fields/single-select";

const noOp = () => {};

describe("field accessibility contracts", () => {
	it("names multi-select value removal and choice editor drag handles", () => {
		const multiSelect = new MultiSelectFieldDefinition();
		const multiSelectConfig = multiSelect.defaultConfig();
		const fieldMarkup = renderToStaticMarkup(
			createElement(multiSelect.component, {
				field: multiSelectConfig,
				value: [multiSelectConfig.options[0].value],
				onChange: noOp,
			}),
		);

		expect(fieldMarkup).toContain('aria-label="Remove Apple"');

		const editorMarkup = [
			renderToStaticMarkup(
				createElement(multiSelect.editor, {
					field: multiSelectConfig,
					isOpen: true,
					onUpdate: noOp,
					onClose: noOp,
				}),
			),
			renderToStaticMarkup(
				createElement(new SingleSelectFieldDefinition().editor, {
					field: new SingleSelectFieldDefinition().defaultConfig(),
					isOpen: true,
					onUpdate: noOp,
					onClose: noOp,
				}),
			),
			renderToStaticMarkup(
				createElement(new RadioGroupFieldDefinition().editor, {
					field: new RadioGroupFieldDefinition().defaultConfig(),
					isOpen: true,
					onUpdate: noOp,
					onClose: noOp,
				}),
			),
		];

		for (const markup of editorMarkup) {
			expect(markup).toContain('aria-label="Reorder Option 1"');
		}
	});

	it("marks upload and rating controls invalid when they display an error", () => {
		const fileUpload = new FileUploadFieldDefinition();
		const rating = new RatingFieldDefinition();

		const fileMarkup = renderToStaticMarkup(
			createElement(fileUpload.component, {
				field: fileUpload.defaultConfig(),
				value: [],
				onChange: noOp,
				error: "Upload a file",
			}),
		);
		const ratingMarkup = renderToStaticMarkup(
			createElement(rating.component, {
				field: rating.defaultConfig(),
				value: undefined,
				onChange: noOp,
				error: "Choose a rating",
			}),
		);

		expect(fileMarkup).toContain('aria-invalid="true"');
		expect(ratingMarkup).toContain('aria-invalid="true"');
		expect(ratingMarkup).toContain("ring-2 ring-destructive");
	});
});
