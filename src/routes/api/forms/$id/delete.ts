import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "#/db";
import { getSessionUserId } from "#/lib/server/session";

export const Route = createFileRoute("/api/forms/$id/delete")({
	server: {
		handlers: {
			DELETE: async ({ params, request }) => {
				const userId = await getSessionUserId(request);

				if (!userId) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				try {
					// Validate the form exists
					const existingForm = await prisma.forms.findUnique({
						where: { id: params.id },
						select: { userId: true }, // Only fetch userId to check ownership, not the entire record
					});

					if (!existingForm) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					if (existingForm.userId !== userId) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}

					await prisma.forms.delete({
						where: { id: params.id },
					});

					return Response.json(params.id);
				} catch (error) {
					console.error("Delete form error:", error);

					// Handle different types of errors
					if (error instanceof Error) {
						// Prisma or other known errors
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

					// Unknown errors
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
