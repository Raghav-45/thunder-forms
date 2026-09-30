import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/db";
import { isFormStructure } from "@/features/form-builder/form-structure";
import {
	drainGoogleSheetsDeliveries,
	enqueueGoogleSheetsResponseBackfill,
} from "@/features/google-sheets/server/deliveries";
import {
	getOwnedGoogleSheetsForm,
	googleSheetsErrorResponse,
} from "@/features/google-sheets/server/owner";
import { createGoogleSheetsHeaders } from "@/features/google-sheets/server/schema";
import {
	acquireGoogleSheetsSetupLock,
	releaseGoogleSheetsSetupLock,
} from "@/features/google-sheets/server/setup-lock";
import {
	createManagedSheetInSpreadsheet,
	deleteManagedSheet,
	type GoogleSpreadsheetTarget,
} from "@/features/google-sheets/server/sheets";
import {
	GoogleSheetsConnectionStatus,
	type Prisma,
} from "@/generated/prisma/client";

function isSpreadsheetId(value: unknown): value is string {
	return typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value);
}

export const Route = createFileRoute(
	"/api/forms/$id/integrations/google-sheets/selection",
)({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				try {
					const { form, userId } = await getOwnedGoogleSheetsForm(
						request,
						params.id,
					);
					if (!isFormStructure(form.fields)) {
						return Response.json(
							{ error: "Form structure is invalid" },
							{ status: 422 },
						);
					}

					const { spreadsheetId } = await request.json();
					if (!isSpreadsheetId(spreadsheetId)) {
						return Response.json(
							{ error: "Invalid spreadsheet selection" },
							{ status: 400 },
						);
					}

					const [connection, existingIntegration] = await Promise.all([
						prisma.google_sheets_connections.findUnique({ where: { userId } }),
						prisma.google_sheets_integrations.findUnique({
							where: { formId: params.id },
						}),
					]);
					if (existingIntegration) {
						return Response.json(
							{ error: "This form already has a Google Sheets destination" },
							{ status: 409 },
						);
					}
					if (connection?.status !== GoogleSheetsConnectionStatus.ACTIVE) {
						return Response.json(
							{ error: "Connect Google before choosing a spreadsheet" },
							{ status: 409 },
						);
					}

					await acquireGoogleSheetsSetupLock(params.id, userId);
					let target: GoogleSpreadsheetTarget | null = null;
					try {
						const headers = createGoogleSheetsHeaders(form.fields);
						target = await createManagedSheetInSpreadsheet(
							connection.encryptedRefreshToken,
							spreadsheetId,
							params.id,
							headers,
						);
						const integration = await prisma.google_sheets_integrations.create({
							data: {
								formId: params.id,
								connectionId: connection.id,
								headers: headers as unknown as Prisma.InputJsonValue,
								...target,
							},
						});
						await enqueueGoogleSheetsResponseBackfill(
							integration.id,
							params.id,
							headers,
						);
						// PORT note: TanStack has no Next `after()`; drain fire-and-forget
						// so the 201 below returns without waiting, matching ORIG behavior.
						drainGoogleSheetsDeliveries(randomUUID()).catch((error) => {
							console.error("Google Sheets backfill sync failed:", error);
						});
						return Response.json({ id: integration.id }, { status: 201 });
					} catch (error) {
						if (target) {
							await deleteManagedSheet(
								connection.encryptedRefreshToken,
								target.spreadsheetId,
								target.sheetId,
							).catch((cleanupError) =>
								console.error(
									"Google Sheets tab cleanup failed:",
									cleanupError,
								),
							);
						}
						throw error;
					} finally {
						await releaseGoogleSheetsSetupLock(params.id, userId);
					}
				} catch (error) {
					return googleSheetsErrorResponse(error);
				}
			},
		},
	},
});
