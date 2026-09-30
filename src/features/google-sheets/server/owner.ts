import { prisma } from "@/db";
import { getSessionUserId } from "@/lib/server/session";

export class GoogleSheetsRouteError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

export async function getOwnedGoogleSheetsForm(
	request: Request,
	formId: string,
) {
	const userId = await getSessionUserId(request);
	if (!userId) throw new GoogleSheetsRouteError("Unauthorized", 401);

	const form = await prisma.forms.findUnique({ where: { id: formId } });
	if (!form) throw new GoogleSheetsRouteError("Form not found", 404);
	if (form.userId !== userId)
		throw new GoogleSheetsRouteError("Unauthorized", 403);

	return { form, userId };
}

export function googleSheetsErrorResponse(error: unknown) {
	if (error instanceof GoogleSheetsRouteError) {
		return Response.json({ error: error.message }, { status: error.status });
	}

	console.error("Google Sheets integration error:", error);
	return Response.json(
		{
			error: "Google Sheets integration failed",
			message:
				process.env.NODE_ENV === "development" && error instanceof Error
					? error.message
					: undefined,
		},
		{ status: 500 },
	);
}
