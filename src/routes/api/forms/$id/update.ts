import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { prisma } from "@/db";
import { isFormStructure } from "@/features/form-builder/form-structure";
import {
	isGoogleSheetsHeaders,
	reconcileGoogleSheetsHeaders,
} from "@/features/google-sheets/server/schema";
import { updateManagedSheetHeaders } from "@/features/google-sheets/server/sheets";
import {
	GoogleSheetsIntegrationStatus,
	type Prisma,
} from "@/generated/prisma/client";
import { getSessionUserId } from "@/lib/server/session";
import { FormValidator } from "@/lib/validators/form";

export const Route = createFileRoute("/api/forms/$id/update")({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const payload = FormValidator.parse(await request.json());
					if (!isFormStructure(payload.fields)) {
						return Response.json(
							{ success: false, error: "Invalid form structure" },
							{ status: 422 },
						);
					}

					const existingForm = await prisma.forms.findUnique({
						where: { id: params.id },
						include: {
							googleSheetsIntegration: { include: { connection: true } },
						},
					});
					if (!existingForm) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					if (existingForm.userId !== userId) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}

					const formData = {
						...payload,
						fields: payload.fields as unknown as Prisma.InputJsonValue,
					};
					const integration = existingForm.googleSheetsIntegration;
					const nextHeaders =
						integration && isGoogleSheetsHeaders(integration.headers)
							? reconcileGoogleSheetsHeaders(
									integration.headers,
									payload.fields,
								)
							: null;
					const headersChanged =
						nextHeaders !== null &&
						JSON.stringify(nextHeaders) !==
							JSON.stringify(integration?.headers);

					if (integration && !nextHeaders) {
						return Response.json(
							{ error: "Google Sheets integration headers are invalid" },
							{ status: 409 },
						);
					}
					if (
						integration &&
						headersChanged &&
						integration.status === GoogleSheetsIntegrationStatus.ACTIVE
					) {
						await updateManagedSheetHeaders(
							integration.connection.encryptedRefreshToken,
							integration.spreadsheetId,
							integration.sheetId,
							nextHeaders,
						);
					}

					const form =
						integration && headersChanged
							? await prisma.$transaction(async (transaction) => {
									const updatedForm = await transaction.forms.update({
										where: { id: existingForm.id },
										data: formData,
									});
									await transaction.google_sheets_integrations.update({
										where: { id: integration.id },
										data: {
											headers: nextHeaders as unknown as Prisma.InputJsonValue,
										},
									});
									return updatedForm;
								})
							: await prisma.forms.update({
									where: { id: existingForm.id },
									data: formData,
								});
					return Response.json(form);
				} catch (error) {
					if (error instanceof z.ZodError) {
						return Response.json(
							{
								success: false,
								error: "Validation error",
								issues: error.issues.map((issue) => ({
									field: issue.path.join("."),
									message: issue.message,
								})),
							},
							{ status: 422 },
						);
					}

					console.error("Error updating form:", error);
					return Response.json(
						{
							success: false,
							error: "Internal server error",
							message:
								process.env.NODE_ENV === "development" && error instanceof Error
									? error.message
									: undefined,
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});
