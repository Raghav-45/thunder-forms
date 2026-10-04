import {
	FILE_UPLOAD_MAX_FILES,
	FILE_UPLOAD_MAX_SIZE_BYTES,
} from "#/features/file-uploads/constants";
import {
	type GeneratedForm,
	GeneratedFormValidator,
} from "#/features/form-builder/core/generated-form";
import type { FieldConfig } from "#/features/form-builder/elements";
import { hasValidChoiceOptions } from "#/features/form-builder/elements/choice-options";
import { clampSliderDefaultValue } from "#/features/form-builder/elements/number-constraints";
import {
	createFormPage,
	createFormSection,
	type FormStructure,
	isFormStructure,
	isKnownFieldIdentifier,
} from "#/features/form-builder/form-structure";
import type { AvailableFieldsType } from "#/features/form-builder/types";
import { createDefaultFieldConfig } from "#/features/form-builder/utils/helperFunctions";
import {
	resolveFieldSpec,
	resolveTemplate,
	resolveTemplateList,
} from "#/routes/api/generatewithai/-prompt";

export const MAX_PROMPT_LENGTH = 12_000;
export const MAX_OUTPUT_TOKENS = 8192;
export const GENERATION_TIMEOUT_MS = 60_000;

export interface GenerationUsage {
	inputTokens: number;
	outputTokens: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function materializeFields(value: unknown): FieldConfig[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const fields: Record<string, unknown>[] = [];
	for (const entry of value) {
		if (
			!isRecord(entry) ||
			"type" in entry ||
			!isKnownFieldIdentifier(entry.uniqueIdentifier)
		) {
			return undefined;
		}
		fields.push(entry);
	}
	for (const field of fields) {
		if (typeof field.label !== "string" || !field.label.trim())
			return undefined;
		for (const key of [
			"description",
			"placeholder",
			"pattern",
			"autoComplete",
			"checkedLabel",
			"uncheckedLabel",
			"unit",
			"dateFormat",
			"minDate",
			"maxDate",
			"minDateTime",
			"maxDateTime",
			"acceptedTypes",
		] as const) {
			if (field[key] !== undefined && typeof field[key] !== "string")
				return undefined;
		}
		for (const key of [
			"required",
			"disabled",
			"requiredValue",
			"showValue",
			"searchable",
			"allowCustomValues",
			"allowDecimals",
			"disablePastDates",
			"disableFutureDates",
		] as const) {
			if (field[key] !== undefined && typeof field[key] !== "boolean")
				return undefined;
		}
		for (const key of [
			"min",
			"max",
			"step",
			"defaultValue",
			"minLength",
			"maxLength",
			"minSelections",
			"maxSelections",
			"maxRating",
			"minuteStep",
			"maxFiles",
			"maxSizeBytes",
		] as const) {
			if (
				field[key] !== undefined &&
				(typeof field[key] !== "number" || !Number.isFinite(field[key]))
			)
				return undefined;
		}
		for (const key of ["minLength", "maxLength"] as const) {
			if (
				typeof field[key] === "number" &&
				(!Number.isInteger(field[key]) || field[key] < 0)
			)
				return undefined;
		}
		if (
			typeof field.minLength === "number" &&
			typeof field.maxLength === "number" &&
			field.minLength > field.maxLength
		)
			return undefined;
		if (typeof field.pattern === "string") {
			try {
				new RegExp(field.pattern);
			} catch {
				return undefined;
			}
		}
		for (const [key, allowed] of [
			["inputType", ["text", "email", "password", "tel", "url"]],
			["orientation", ["vertical", "horizontal"]],
			["mode", ["time", "duration"]],
			["style", ["star", "heart", "thumb", "emoji"]],
			["size", ["sm", "default", "lg"]],
			[
				"dateFormat",
				["PPP", "PP", "P", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"],
			],
		] as const) {
			if (
				field[key] !== undefined &&
				!(allowed as readonly unknown[]).includes(field[key])
			)
				return undefined;
		}
		if (
			field.maxRating !== undefined &&
			(!Number.isInteger(field.maxRating) ||
				Number(field.maxRating) < 2 ||
				Number(field.maxRating) > 10)
		)
			return undefined;
		if (
			field.uniqueIdentifier === "rating" &&
			field.step !== undefined &&
			field.step !== 0.5 &&
			field.step !== 1
		)
			return undefined;
		if (field.style === "emoji" && field.step !== undefined && field.step !== 1)
			return undefined;
		if (
			field.minuteStep !== undefined &&
			![1, 5, 10, 15, 30].includes(Number(field.minuteStep))
		)
			return undefined;
		for (const key of ["maxFiles", "maxSizeBytes"] as const) {
			if (
				field[key] !== undefined &&
				(!Number.isInteger(field[key]) || Number(field[key]) < 1)
			)
				return undefined;
		}
		if (
			(typeof field.maxFiles === "number" &&
				field.maxFiles > FILE_UPLOAD_MAX_FILES) ||
			(typeof field.maxSizeBytes === "number" &&
				field.maxSizeBytes > FILE_UPLOAD_MAX_SIZE_BYTES)
		)
			return undefined;
		if (
			["multi-select", "single-select", "radio-group"].includes(
				String(field.uniqueIdentifier),
			)
		) {
			// Validate labels/values before assigning new option IDs. Invalid
			// choices must fail rather than be repaired or dropped.
			if (!Array.isArray(field.options) || field.options.length === 0)
				return undefined;
			const options = field.options.map((option, index) =>
				isRecord(option) ? { ...option, id: `option_${index}` } : option,
			);
			if (!hasValidChoiceOptions(options)) return undefined;
		}
	}
	return fields.map((field): FieldConfig => {
		const defaults = createDefaultFieldConfig(
			field.uniqueIdentifier as AvailableFieldsType,
		);
		const result: FieldConfig & Record<string, unknown> = {
			...defaults,
			...field,
			label: field.label as string,
			// Generic descriptions can promise unsupported behavior for a different
			// question. Only use copy supplied for this question.
			description: (field.description as string | undefined) ?? "",
			placeholder: (field.placeholder as string | undefined) ?? "",
			id: defaults.id,
		};
		if (Array.isArray(field.options)) {
			result.options = field.options.map((option) => ({
				...(option as Record<string, unknown>),
				id: `option_${crypto.randomUUID()}`,
			}));
		}
		if (
			defaults.uniqueIdentifier === "slider" &&
			field.defaultValue === undefined
		) {
			const min = Number(field.min ?? defaults.min ?? 0);
			const max = Number(field.max ?? defaults.max ?? 100);
			const step = Number(field.step ?? defaults.step ?? 1);
			if (min <= max && step > 0) {
				result.defaultValue = clampSliderDefaultValue(
					defaults.defaultValue ?? min,
					min,
					max,
					step,
				);
			}
		}
		return result;
	});
}

function materializePages(value: unknown): FormStructure | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined;
	const pages: FormStructure["pages"] = [];

	for (const sourcePage of value) {
		if (
			!isRecord(sourcePage) ||
			Object.keys(sourcePage).some(
				(key) => !["id", "title", "description", "sections"].includes(key),
			) ||
			!Array.isArray(sourcePage.sections) ||
			sourcePage.sections.length === 0
		) {
			return undefined;
		}
		if (
			(sourcePage.title !== undefined &&
				typeof sourcePage.title !== "string") ||
			(sourcePage.description !== undefined &&
				typeof sourcePage.description !== "string")
		) {
			return undefined;
		}

		const sections: FormStructure["pages"][number]["sections"] = [];
		for (const sourceSection of sourcePage.sections) {
			if (
				!isRecord(sourceSection) ||
				Object.keys(sourceSection).some(
					(key) => !["id", "title", "description", "fields"].includes(key),
				) ||
				!Array.isArray(sourceSection.fields)
			)
				return undefined;
			if (
				(sourceSection.title !== undefined &&
					typeof sourceSection.title !== "string") ||
				(sourceSection.description !== undefined &&
					typeof sourceSection.description !== "string")
			) {
				return undefined;
			}
			const fields = materializeFields(sourceSection.fields);
			if (!fields || fields.length === 0) return undefined;
			sections.push({
				...createFormSection(fields),
				...(sourceSection.title !== undefined
					? { title: sourceSection.title }
					: {}),
				...(sourceSection.description !== undefined
					? { description: sourceSection.description }
					: {}),
			});
		}

		pages.push({
			...createFormPage(sections),
			...(sourcePage.title !== undefined ? { title: sourcePage.title } : {}),
			...(sourcePage.description !== undefined
				? { description: sourcePage.description }
				: {}),
		});
	}

	return { pages };
}

/** One request's tool state. Templates never leak between users or requests. */
export class GenerationSession {
	private templates = new Map<string, GeneratedForm>();
	private directTemplate: GeneratedForm | undefined;

	executeToolCall(name: unknown, args?: unknown): Record<string, unknown> {
		// A direct result applies only to the most recent single-call batch.
		this.directTemplate = undefined;
		if (name === "list_templates") return resolveTemplateList();
		if (name !== "get_template") return resolveFieldSpec(name);
		const result = resolveTemplate(args);
		if (typeof result.error === "string") return result;
		if (!isFormStructure(result.fields) || typeof result.slug !== "string") {
			return { error: "Invalid template configuration" };
		}
		const cached = this.templates.get(result.slug);
		const form: GeneratedForm = cached ?? {
			title: String(result.title),
			description: String(result.description),
			fields: result.fields,
			...(typeof result.submitButtonText === "string"
				? { submitButtonText: result.submitButtonText }
				: {}),
		};
		this.templates.set(result.slug, form);
		if (isRecord(args) && args.useAsIs === true) this.directTemplate = form;
		// Keep the model's template context in the same canonical hierarchy as
		// persisted forms. IDs and existing field configuration stay server-side;
		// additions are returned as new pages and appended without rewriting it.
		return {
			description: form.description,
			fields: {
				pages: form.fields.pages.map((page) => ({
					...(page.title !== undefined ? { title: page.title } : {}),
					...(page.description !== undefined
						? { description: page.description }
						: {}),
					sections: page.sections.map((section) => ({
						...(section.title !== undefined ? { title: section.title } : {}),
						...(section.description !== undefined
							? { description: section.description }
							: {}),
						fieldCount: section.fields.length,
					})),
				})),
			},
			slug: result.slug,
			submitButtonText: form.submitButtonText,
			title: form.title,
		};
	}

	getDirectTemplateResponse(
		callCount: number,
		startTime: number,
		usage?: GenerationUsage,
	): Response | undefined {
		if (callCount !== 1 || !this.directTemplate) return undefined;
		return this.success(this.directTemplate, startTime, usage);
	}

	createResponse(
		text: string,
		startTime: number,
		usage?: GenerationUsage,
	): Response {
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return Response.json(
				{
					error: "AI returned invalid JSON",
					...(process.env.NODE_ENV === "development"
						? { raw: text.slice(0, 4000) }
						: {}),
				},
				{ status: 502 },
			);
		}
		const invalid = () =>
			Response.json(
				{ error: "AI returned an unexpected form shape" },
				{ status: 502 },
			);
		if (!isRecord(parsed)) return invalid();
		const base =
			typeof parsed.templateSlug === "string"
				? this.templates.get(parsed.templateSlug)
				: undefined;
		if (parsed.templateSlug !== undefined && !base) return invalid();
		if (!isRecord(parsed.fields)) return invalid();
		if (
			Object.keys(parsed.fields).some(
				(key) => !["pages", "layout", "quiz", "theme"].includes(key),
			)
		)
			return invalid();
		const generatedPages = materializePages(parsed.fields.pages);
		if (!generatedPages) return invalid();
		const generatedStructure = { ...parsed.fields, ...generatedPages };
		const title = parsed.title === undefined ? base?.title : parsed.title;
		const description =
			parsed.description === undefined ? base?.description : parsed.description;
		const submitButtonText =
			parsed.submitButtonText === undefined
				? base?.submitButtonText
				: parsed.submitButtonText;
		let structure: FormStructure;
		if (base) {
			// Preserve original pages, sections, field configs, IDs, and defaults.
			// New template content is already a valid page/section/field tree.
			structure = structuredClone(base.fields);
			structure.pages.push(...generatedStructure.pages);
		} else {
			structure = generatedStructure;
		}
		const { templateSlug: _templateSlug, ...generatedForm } = parsed;
		const form = GeneratedFormValidator.safeParse({
			...generatedForm,
			title,
			description,
			fields: structure,
			...(submitButtonText !== undefined ? { submitButtonText } : {}),
		});
		if (!form.success) return invalid();
		return this.success(form.data, startTime, usage);
	}

	private success(
		form: GeneratedForm,
		startTime: number,
		usage?: GenerationUsage,
	): Response {
		const responseTimeMs = Date.now() - startTime;
		return Response.json({
			...form,
			meta: {
				responseTime: `${responseTimeMs}ms`,
				responseTimeSeconds: `${(responseTimeMs / 1000).toFixed(2)}s`,
				...(usage ? { usage } : {}),
			},
		});
	}
}
