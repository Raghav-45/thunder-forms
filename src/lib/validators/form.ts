import { z } from "zod/v3";

export const SuccessExtraButtonValidator = z.object({
	id: z.string().min(1).max(100),
	label: z
		.string()
		.min(1, "Label is required")
		.max(50, "Must be 50 characters or less"),
	url: z.string().url("Must be a valid URL"),
});

export type SuccessExtraButton = z.infer<typeof SuccessExtraButtonValidator>;

/** Drop malformed stored buttons; the save validator rejects them loudly. */
export function normalizeSuccessExtraButtons(
	value: unknown,
): SuccessExtraButton[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		const parsed = SuccessExtraButtonValidator.safeParse(item);
		return parsed.success ? [parsed.data] : [];
	});
}

export const SUCCESS_BLOCK_IDS = ["title", "message", "buttons"] as const;

export type SuccessBlockId = (typeof SUCCESS_BLOCK_IDS)[number];

/** Order stored block ids first, then append any missing default blocks. */
export function normalizeSuccessBlockOrder(value: unknown): SuccessBlockId[] {
	const ids = Array.isArray(value)
		? value.filter((item): item is SuccessBlockId =>
				(SUCCESS_BLOCK_IDS as readonly string[]).includes(
					typeof item === "string" ? item : "",
				),
			)
		: [];
	const seen = new Set<SuccessBlockId>();
	const ordered = ids.filter((id) => {
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
	for (const id of SUCCESS_BLOCK_IDS) {
		if (!seen.has(id)) ordered.push(id);
	}
	return ordered;
}

export const FormValidator = z.object({
	title: z.string().min(2, "Title is required"),
	description: z.string().nullable().optional(),
	fields: z.unknown(),
	maxSubmissions: z
		.number()
		.int()
		.min(1, "Must be at least 1")
		.nullable()
		.optional(),
	expiresAt: z.coerce
		.date()
		.refine(
			(date) => date > new Date(),
			"Expiration date must be in the future",
		)
		.optional(),
	redirectUrl: z.string().url("Must be a valid URL").nullable().optional(),
	submitButtonText: z
		.string()
		.max(50, "Must be 50 characters or less")
		.nullable()
		.optional(),
	submitAnotherResponseText: z
		.string()
		.max(50, "Must be 50 characters or less")
		.nullable()
		.optional(),
	returnToHomepageText: z
		.string()
		.max(50, "Must be 50 characters or less")
		.nullable()
		.optional(),
	showSubmitAnotherResponse: z.boolean().optional(),
	showReturnToHomepage: z.boolean().optional(),
	successExtraButtons: z
		.array(SuccessExtraButtonValidator)
		.max(10, "At most 10 extra buttons are allowed")
		.nullable()
		.optional(),
	successTitle: z
		.string()
		.max(100, "Must be 100 characters or less")
		.nullable()
		.optional(),
	successMessage: z
		.string()
		.max(1000, "Must be 1000 characters or less")
		.nullable()
		.optional(),
	successBlockOrder: z
		.array(z.enum(SUCCESS_BLOCK_IDS))
		.max(3, "At most 3 blocks are allowed")
		.nullable()
		.optional(),
});

export type CreateFormPayload = z.infer<typeof FormValidator>;
