import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "#/db";
import { isFormStructure } from "#/features/form-builder/form-structure";
import { Prisma } from "#/generated/prisma/client";
import { getSessionUserId } from "#/lib/server/session";

export const Route = createFileRoute("/api/forms/$id/duplicate")({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				const userId = await getSessionUserId(request);

				if (!userId) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				try {
					const existingForm = await prisma.forms.findUnique({
						where: { id: params.id },
					});

					if (!existingForm) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					if (existingForm.userId !== userId) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}

					if (!isFormStructure(existingForm.fields)) {
						return Response.json(
							{ error: "Invalid form structure" },
							{ status: 422 },
						);
					}

					const duplicatedForm = await prisma.forms.create({
						data: {
							userId,
							title: `${existingForm.title} (Copy)`,
							description: existingForm.description,
							fields: existingForm.fields as unknown as Prisma.InputJsonValue,
							maxSubmissions: existingForm.maxSubmissions,
							expiresAt: existingForm.expiresAt,
							redirectUrl: existingForm.redirectUrl,
							submitButtonText: existingForm.submitButtonText,
							submitAnotherResponseText: existingForm.submitAnotherResponseText,
							returnToHomepageText: existingForm.returnToHomepageText,
							showSubmitAnotherResponse: existingForm.showSubmitAnotherResponse,
							showReturnToHomepage: existingForm.showReturnToHomepage,
							successExtraButtons:
								existingForm.successExtraButtons == null
									? Prisma.DbNull
									: (existingForm.successExtraButtons as unknown as Prisma.InputJsonValue),
							successTitle: existingForm.successTitle,
							successMessage: existingForm.successMessage,
							successBlockOrder:
								existingForm.successBlockOrder == null
									? Prisma.DbNull
									: (existingForm.successBlockOrder as unknown as Prisma.InputJsonValue),
						},
					});

					return Response.json(
						{ success: true, id: duplicatedForm.id },
						{ status: 201 },
					);
				} catch (error) {
					console.error("Duplicate form error:", error);

					if (error instanceof Error) {
						return Response.json(
							{
								error: "Database error occurred",
								message:
									process.env.NODE_ENV === "development"
										? error.message
										: undefined,
							},
							{ status: 500 },
						);
					}

					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
