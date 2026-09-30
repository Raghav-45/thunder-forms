import { prisma } from "@/db";
import {
	getOrderedFormFields,
	isFormStructure,
} from "@/features/form-builder/form-structure";
import { getSessionUserId } from "@/lib/server/session";

export class FileUploadRouteError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

export async function getOwnedFileUploadForm(request: Request, formId: string) {
	const userId = await getSessionUserId(request);
	if (!userId) throw new FileUploadRouteError("Unauthorized", 401);

	const form = await prisma.forms.findUnique({ where: { id: formId } });
	if (!form) throw new FileUploadRouteError("Form not found", 404);
	if (form.userId !== userId)
		throw new FileUploadRouteError("Unauthorized", 403);

	return { form, userId };
}

/**
 * Destination setup is meaningful only for a saved File Upload field. Keeping
 * this check beside the ownership guard prevents setup routes from accepting
 * arbitrary field IDs.
 */
export async function getOwnedFileUploadField(
	request: Request,
	formId: string,
	fieldId: string,
) {
	const { form, userId } = await getOwnedFileUploadForm(request, formId);
	const field = isFormStructure(form.fields)
		? getOrderedFormFields(form.fields).find(
				(candidate) => candidate.id === fieldId,
			)
		: undefined;

	if (!field || field.uniqueIdentifier !== "file-upload") {
		throw new FileUploadRouteError("File upload field not found", 404);
	}

	return { form, userId };
}

export function fileUploadErrorResponse(error: unknown) {
	if (error instanceof FileUploadRouteError) {
		return Response.json({ error: error.message }, { status: error.status });
	}

	console.error("File upload integration error:", error);
	return Response.json(
		{
			error: "File upload integration failed",
			message:
				process.env.NODE_ENV === "development" && error instanceof Error
					? error.message
					: undefined,
		},
		{ status: 500 },
	);
}
