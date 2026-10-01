import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "#/db";
import { getSessionUserId } from "#/lib/server/session";

export const Route = createFileRoute("/api/templates")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					// Fetch templates - assuming templates are public or user-specific
					// If templates should be user-specific, add: where: { createdBy: userId }
					const templates = await prisma.templates.findMany({
						orderBy: {
							createdAt: "desc", // Get newest first
						},
					});

					return Response.json(templates);
				} catch (error) {
					console.error("Get templates error:", error);

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
				} finally {
					// No need to disconnect when using shared Prisma instance
					// The singleton handles connection management
				}
			},
		},
	},
});
