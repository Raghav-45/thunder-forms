import { z } from "zod/v3";
import {
	type FormStructure,
	isFormStructure,
} from "#/features/form-builder/form-structure";
import { FormValidator } from "#/lib/validators/form";

// AI creates a populated form using the same metadata and tree as form saves.
export const GeneratedFormValidator = FormValidator.pick({
	title: true,
	description: true,
	fields: true,
	submitButtonText: true,
})
	.extend({
		title: FormValidator.shape.title.refine(
			(value) => value.trim().length > 0,
			"Title is required",
		),
		fields: z.custom<FormStructure>(
			(value) =>
				isFormStructure(value) &&
				value.pages.every(
					(page) =>
						page.sections.length > 0 &&
						page.sections.every((section) => section.fields.length > 0),
				),
			"Invalid generated form structure",
		),
	})
	.strict();

export type GeneratedForm = z.infer<typeof GeneratedFormValidator>;

export const GeneratedFormResponseValidator = GeneratedFormValidator.extend({
	meta: z.object({
		responseTime: z.string(),
		responseTimeSeconds: z.string(),
		usage: z
			.object({ inputTokens: z.number(), outputTokens: z.number() })
			.optional(),
	}),
});
