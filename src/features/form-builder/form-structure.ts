import type { FieldConfig } from "#/features/form-builder/elements";
import {
	hasValidChoiceOptions,
	normalizeChoiceOptions,
} from "#/features/form-builder/elements/choice-options";
import {
	isFormTheme,
	type StoredFormTheme,
} from "#/features/form-builder/theme";

export interface FormSection {
	description?: string;
	id: string;
	fields: FieldConfig[];
	title?: string;
}

export interface FormPage {
	description?: string;
	id: string;
	sections: FormSection[];
	title?: string;
}

export interface FormStructure {
	pages: FormPage[];
	layout?: FormLayout;
	quiz?: QuizSettings;
	theme?: StoredFormTheme;
}

export type FormContentWidth = "compact" | "standard" | "wide";
export type FormHorizontalAlignment = "left" | "center" | "right";
export type FormSectionSpacing = "compact" | "comfortable" | "spacious";
export type FormSubmitWidth = "auto" | "full" | "responsive";

export interface FormLayoutSpacing {
	fieldGap?: number;
	sectionGap?: number;
	sectionTitleGap?: number;
	submitGap?: number;
	titleContentGap?: number;
	titleDescriptionGap?: number;
}

export interface FormLayout {
	contentAlignment?: Exclude<FormHorizontalAlignment, "right">;
	headerAlignment?: Exclude<FormHorizontalAlignment, "right">;
	contentWidth?: FormContentWidth;
	sectionSpacing?: FormSectionSpacing;
	spacing?: FormLayoutSpacing;
	submitAlignment?: FormHorizontalAlignment;
	submitWidth?: FormSubmitWidth;
}

export type NormalizedFormLayout = Omit<Required<FormLayout>, "spacing"> & {
	spacing: Required<FormLayoutSpacing>;
};

export const DEFAULT_FORM_LAYOUT: NormalizedFormLayout = {
	contentAlignment: "center",
	headerAlignment: "left",
	contentWidth: "standard",
	sectionSpacing: "comfortable",
	spacing: {
		fieldGap: 5,
		sectionGap: 6,
		sectionTitleGap: 5,
		submitGap: 6,
		titleContentGap: 6,
		titleDescriptionGap: 3,
	},
	submitAlignment: "left",
	submitWidth: "responsive",
};

export type QuizGradeRelease = "immediately" | "after-review";

export interface QuizSettings {
	defaultPoints?: number;
	enabled: boolean;
	gradeRelease?: QuizGradeRelease;
	recipientEmailFieldId?: string;
}

export type FormStructureIdFactory = () => string;

type UnknownRecord = Record<string, unknown>;

// This validator runs in API routes as well as client components. Keep its
// runtime dependencies server-safe; importing the client field registry here
// makes valid fields appear unknown to the server bundle.
const KNOWN_FIELD_IDENTIFIERS = new Set<string>([
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
]);

const CHOICE_FIELD_IDENTIFIERS = new Set<string>([
	"multi-select",
	"single-select",
	"radio-group",
]);

const QUIZ_ANSWER_FIELD_IDENTIFIERS = new Set<string>([
	"multi-select",
	"single-select",
	"radio-group",
	"text-input",
]);

const createId = () => crypto.randomUUID();

const isRecord = (value: unknown): value is UnknownRecord =>
	typeof value === "object" && value !== null;

const hasId = (value: unknown): value is string =>
	typeof value === "string" && value.length > 0;

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const hasValidDateRange = (
	value: UnknownRecord,
	minKey: "minDate" | "minDateTime",
	maxKey: "maxDate" | "maxDateTime",
): boolean => {
	const min = value[minKey];
	const max = value[maxKey];
	if (
		min !== undefined &&
		(typeof min !== "string" || Number.isNaN(Date.parse(min)))
	) {
		return false;
	}
	if (
		max !== undefined &&
		(typeof max !== "string" || Number.isNaN(Date.parse(max)))
	) {
		return false;
	}
	return (
		min === undefined || max === undefined || Date.parse(min) <= Date.parse(max)
	);
};

const isOnStep = (value: number, step: number, base: number): boolean => {
	const steps = (value - base) / step;
	return (
		Math.abs(steps - Math.round(steps)) <=
		Number.EPSILON * Math.max(1, Math.abs(steps)) * 4
	);
};

const hasValidFieldConstraints = (value: UnknownRecord): boolean => {
	switch (value.uniqueIdentifier) {
		case "number-input": {
			const { min, max, step } = value;
			return (
				(min === undefined || isFiniteNumber(min)) &&
				(max === undefined || isFiniteNumber(max)) &&
				(step === undefined || (isFiniteNumber(step) && step > 0)) &&
				!(isFiniteNumber(min) && isFiniteNumber(max) && min > max)
			);
		}
		case "slider": {
			const min = value.min === undefined ? 0 : value.min;
			const max = value.max === undefined ? 100 : value.max;
			const step = value.step === undefined ? 1 : value.step;
			const defaultValue = value.defaultValue;
			return (
				isFiniteNumber(min) &&
				isFiniteNumber(max) &&
				min <= max &&
				isFiniteNumber(step) &&
				step > 0 &&
				(defaultValue === undefined ||
					(isFiniteNumber(defaultValue) &&
						defaultValue >= min &&
						defaultValue <= max &&
						isOnStep(defaultValue, step, min)))
			);
		}
		case "multi-select": {
			const { minSelections, maxSelections } = value;
			return (
				(minSelections === undefined ||
					(isFiniteNumber(minSelections) &&
						Number.isInteger(minSelections) &&
						minSelections >= 0)) &&
				(maxSelections === undefined ||
					(isFiniteNumber(maxSelections) &&
						Number.isInteger(maxSelections) &&
						maxSelections >= 1)) &&
				!(
					typeof minSelections === "number" &&
					typeof maxSelections === "number" &&
					minSelections > maxSelections
				)
			);
		}
		case "date-picker":
			return hasValidDateRange(value, "minDate", "maxDate");
		case "datetime-picker":
			return hasValidDateRange(value, "minDateTime", "maxDateTime");
		default:
			return true;
	}
};

function hasValidQuizQuestion(value: unknown, field: UnknownRecord): boolean {
	if (value === undefined) return true;
	if (!isRecord(value)) {
		return false;
	}
	if (
		!Number.isInteger(value.points) ||
		typeof value.points !== "number" ||
		value.points < 1
	) {
		return false;
	}
	if (value.correctAnswers === undefined) return true;
	if (
		!QUIZ_ANSWER_FIELD_IDENTIFIERS.has(String(field.uniqueIdentifier)) ||
		!Array.isArray(value.correctAnswers) ||
		!value.correctAnswers.every(
			(answer) => typeof answer === "string" && answer.trim(),
		)
	)
		return false;

	const correctAnswers = value.correctAnswers as string[];
	if (
		new Set(correctAnswers).size !== correctAnswers.length ||
		correctAnswers.length === 0
	) {
		return false;
	}

	if (field.uniqueIdentifier === "text-input") {
		return (field.inputType ?? "text") === "text";
	}

	const options = Array.isArray(field.options) ? field.options : [];
	const optionValues = new Set(
		options.flatMap((option) =>
			isRecord(option) && typeof option.value === "string"
				? [option.value]
				: [],
		),
	);
	return correctAnswers.every((answer) => optionValues.has(answer));
}

function hasValidQuizSettings(
	value: unknown,
): value is QuizSettings | undefined {
	if (value === undefined) return true;
	if (!isRecord(value) || typeof value.enabled !== "boolean") return false;
	if (
		value.defaultPoints !== undefined &&
		(!Number.isInteger(value.defaultPoints) ||
			typeof value.defaultPoints !== "number" ||
			value.defaultPoints < 1)
	)
		return false;
	if (
		value.gradeRelease !== undefined &&
		value.gradeRelease !== "immediately" &&
		value.gradeRelease !== "after-review"
	)
		return false;
	return (
		value.recipientEmailFieldId === undefined ||
		hasId(value.recipientEmailFieldId)
	);
}

export function isFormLayout(value: unknown): value is FormLayout {
	if (value === undefined) return true;
	if (!isRecord(value)) return false;
	return (
		(value.contentAlignment === undefined ||
			value.contentAlignment === "left" ||
			value.contentAlignment === "center") &&
		(value.headerAlignment === undefined ||
			value.headerAlignment === "left" ||
			value.headerAlignment === "center") &&
		(value.contentWidth === undefined ||
			value.contentWidth === "compact" ||
			value.contentWidth === "standard" ||
			value.contentWidth === "wide") &&
		(value.sectionSpacing === undefined ||
			value.sectionSpacing === "compact" ||
			value.sectionSpacing === "comfortable" ||
			value.sectionSpacing === "spacious") &&
		hasValidLayoutSpacing(value.spacing) &&
		(value.submitAlignment === undefined ||
			value.submitAlignment === "left" ||
			value.submitAlignment === "center" ||
			value.submitAlignment === "right") &&
		(value.submitWidth === undefined ||
			value.submitWidth === "auto" ||
			value.submitWidth === "full" ||
			value.submitWidth === "responsive")
	);
}

function hasValidLayoutSpacing(value: unknown): value is FormLayoutSpacing {
	if (value === undefined) return true;
	if (!isRecord(value) || Array.isArray(value)) return false;
	return Object.entries(value).every(
		([key, gap]) =>
			[
				"fieldGap",
				"sectionGap",
				"sectionTitleGap",
				"submitGap",
				"titleContentGap",
				"titleDescriptionGap",
			].includes(key) &&
			typeof gap === "number" &&
			Number.isFinite(gap) &&
			gap >= 0 &&
			gap <= 16,
	);
}

export function normalizeFormLayout(layout?: FormLayout): NormalizedFormLayout {
	return {
		...DEFAULT_FORM_LAYOUT,
		...layout,
		spacing: { ...DEFAULT_FORM_LAYOUT.spacing, ...layout?.spacing },
	};
}

export function getQuizDefaultPoints(
	settings: QuizSettings | undefined,
): number {
	return settings?.defaultPoints ?? 1;
}

export function getQuizGradeRelease(
	settings: QuizSettings | undefined,
): QuizGradeRelease {
	return settings?.gradeRelease ?? "immediately";
}

const isKnownField = (value: unknown): value is FieldConfig => {
	if (!isRecord(value) || !hasId(value.id) || !hasId(value.uniqueIdentifier)) {
		return false;
	}

	if (!KNOWN_FIELD_IDENTIFIERS.has(value.uniqueIdentifier)) return false;

	return (
		(!CHOICE_FIELD_IDENTIFIERS.has(value.uniqueIdentifier) ||
			hasValidChoiceOptions(value.options)) &&
		hasValidFieldConstraints(value) &&
		hasValidQuizQuestion(value.quiz, value)
	);
};

export function isKnownFieldIdentifier(value: unknown): boolean {
	return typeof value === "string" && KNOWN_FIELD_IDENTIFIERS.has(value);
}

const hasUniqueId = (ids: Set<string>, id: string): boolean => {
	if (ids.has(id)) return false;

	ids.add(id);
	return true;
};

export function createFormSection(
	fields: FieldConfig[] = [],
	idFactory: FormStructureIdFactory = createId,
): FormSection {
	return { id: idFactory(), fields };
}

export function createFormPage(
	sections: FormSection[] = [],
	idFactory: FormStructureIdFactory = createId,
): FormPage {
	return { id: idFactory(), sections };
}

export function createFormStructure(
	fields: FieldConfig[] = [],
	idFactory: FormStructureIdFactory = createId,
): FormStructure {
	return {
		pages: [createFormPage([createFormSection(fields, idFactory)], idFactory)],
	};
}

export function isFormStructure(value: unknown): value is FormStructure {
	if (
		!isRecord(value) ||
		!Array.isArray(value.pages) ||
		value.pages.length === 0 ||
		!isFormLayout(value.layout) ||
		!hasValidQuizSettings(value.quiz) ||
		(value.theme !== undefined && !isFormTheme(value.theme))
	) {
		return false;
	}

	const ids = new Set<string>();

	return value.pages.every((page) => {
		if (
			!isRecord(page) ||
			!hasId(page.id) ||
			!hasUniqueId(ids, page.id) ||
			!Array.isArray(page.sections) ||
			(page.title !== undefined && typeof page.title !== "string") ||
			(page.description !== undefined && typeof page.description !== "string")
		) {
			return false;
		}

		return page.sections.every((section) => {
			if (
				!isRecord(section) ||
				!hasId(section.id) ||
				!hasUniqueId(ids, section.id) ||
				!Array.isArray(section.fields) ||
				(section.title !== undefined && typeof section.title !== "string") ||
				(section.description !== undefined &&
					typeof section.description !== "string")
			) {
				return false;
			}

			return section.fields.every(
				(field) => isKnownField(field) && hasUniqueId(ids, field.id),
			);
		});
	});
}

export function isAutoGradableQuizField(field: FieldConfig): boolean {
	if (!QUIZ_ANSWER_FIELD_IDENTIFIERS.has(field.uniqueIdentifier)) return false;
	return (
		field.uniqueIdentifier !== "text-input" ||
		((field as { inputType?: string }).inputType ?? "text") === "text"
	);
}

export function hasQuizAnswerKey(field: FieldConfig): boolean {
	return (
		isAutoGradableQuizField(field) &&
		Boolean(field.quiz?.correctAnswers?.length)
	);
}

export function isQuizScoredField(
	field: FieldConfig,
	settings: QuizSettings | undefined,
): boolean {
	return Boolean(field.quiz) && field.id !== settings?.recipientEmailFieldId;
}

export function stripQuizAnswerKeys(structure: FormStructure): FormStructure {
	return {
		...structure,
		pages: structure.pages.map((page) => ({
			...page,
			sections: page.sections.map((section) => ({
				...section,
				fields: section.fields.map((field) => {
					if (!field.quiz) return field;
					return { ...field, quiz: undefined } as FieldConfig;
				}),
			})),
		})),
	};
}

export function getOrderedFormFields(structure: FormStructure): FieldConfig[] {
	return structure.pages.flatMap((page) =>
		page.sections.flatMap((section) => section.fields),
	);
}

/**
 * Sanitize externally produced fields (AI generation, Google import) before
 * they enter builder state. Drops unknown field types and repairs missing or
 * duplicate ids so the result always passes `isFormStructure` id rules.
 */
export function sanitizeImportedFields(value: unknown): FieldConfig[] {
	if (!Array.isArray(value)) return [];

	const seen = new Set<string>();
	const clean: FieldConfig[] = [];

	for (const entry of value) {
		if (!isRecord(entry) || !isKnownFieldIdentifier(entry.uniqueIdentifier)) {
			continue;
		}
		const field = entry as unknown as FieldConfig;
		if (!hasId(field.id) || seen.has(field.id)) {
			field.id = `imported_${createId()}`;
		}
		if (CHOICE_FIELD_IDENTIFIERS.has(field.uniqueIdentifier)) {
			const mutableField = field as unknown as UnknownRecord;
			mutableField.options = normalizeChoiceOptions(mutableField.options);
		}
		seen.add(field.id);
		clean.push(field);
	}

	return clean;
}
