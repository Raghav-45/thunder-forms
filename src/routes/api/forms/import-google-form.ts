import { createFileRoute } from "@tanstack/react-router";

import {
	importGoogleForm,
	listGoogleForms,
} from "#/features/google-forms-import/server/forms";
import {
	consumeGoogleFormsImportSession,
	getGoogleFormsImportAccessToken,
	setGoogleFormsImportCookie,
} from "#/features/google-forms-import/server/session";
import { getSessionUserId } from "#/lib/server/session";

function googleErrorStatus(error: unknown): number | null {
	if (typeof error !== "object" || error === null) return null;
	const response = (error as { response?: { status?: unknown } }).response;
	if (typeof response?.status === "number") return response.status;
	const code = (error as { code?: unknown }).code;
	return typeof code === "number" ? code : null;
}

function isGoogleFormId(value: unknown): value is string {
	return typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value);
}

function clearImportSession(response: Response) {
	return setGoogleFormsImportCookie(response, "", 0);
}

export const Route = createFileRoute("/api/forms/import-google-form")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const accessToken = await getGoogleFormsImportAccessToken(
						request,
						userId,
					);
					if (!accessToken) {
						return clearImportSession(
							Response.json(
								{
									error: "Google authorization expired. Connect Google again.",
								},
								{ status: 401 },
							),
						);
					}

					const url = new URL(request.url);
					const pageToken = url.searchParams.get("pageToken");
					if (pageToken && pageToken.length > 1_000) {
						return Response.json(
							{ error: "Invalid page token" },
							{ status: 400 },
						);
					}
					const search = url.searchParams.get("search")?.trim();
					if (search && search.length > 200) {
						return Response.json(
							{ error: "Search query is too long" },
							{ status: 400 },
						);
					}

					return Response.json(
						await listGoogleForms(
							accessToken,
							pageToken || undefined,
							search || undefined,
						),
					);
				} catch (error) {
					console.error("Google Forms listing failed:", error);
					const status = googleErrorStatus(error);
					return Response.json(
						{
							error:
								status === 401 || status === 403
									? "Google authorization expired. Connect Google again."
									: "Could not load Google Forms",
						},
						{ status: status === 401 || status === 403 ? 401 : 500 },
					);
				}
			},
			POST: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					let body: unknown;
					try {
						body = await request.json();
					} catch {
						return Response.json(
							{ error: "Invalid import request" },
							{ status: 400 },
						);
					}
					const formId =
						body && typeof body === "object" && "formId" in body
							? body.formId
							: undefined;
					if (!isGoogleFormId(formId)) {
						return Response.json(
							{ error: "Invalid Google Form selection" },
							{ status: 400 },
						);
					}

					const accessToken = await getGoogleFormsImportAccessToken(
						request,
						userId,
					);
					if (!accessToken) {
						return clearImportSession(
							Response.json(
								{
									error: "Google authorization expired. Connect Google again.",
								},
								{ status: 401 },
							),
						);
					}

					const result = await importGoogleForm(accessToken, formId);
					await consumeGoogleFormsImportSession(request, userId);
					return clearImportSession(Response.json(result));
				} catch (error) {
					console.error("Google Forms import failed:", error);
					const status = googleErrorStatus(error);
					return Response.json(
						{
							error:
								status === 404
									? "That Google Form is no longer available."
									: status === 401 || status === 403
										? "Google authorization expired. Connect Google again."
										: "Could not import Google Form",
						},
						{
							status:
								status === 404
									? 404
									: status === 401 || status === 403
										? 401
										: 500,
						},
					);
				}
			},
		},
	},
});
