import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "#/db";
import { getSessionUserId } from "#/lib/server/session";

export const Route = createFileRoute("/api/forms")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					// Fetch forms for the authenticated user only
					const forms = await prisma.forms.findMany({
						orderBy: {
							createdAt: "desc",
						},
						where: { userId },
						select: {
							id: true,
							title: true,
							description: true,
							createdAt: true,
							expiresAt: true,
							maxSubmissions: true,
							_count: {
								select: {
									responses: true,
								},
							},
						},
					});

					return Response.json(forms);
				} catch (error) {
					console.error("API Error:", error);

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
