import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import { getSessionUserId } from "@/lib/server/session";

export const Route = createFileRoute("/api/forms/$id")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const form = await prisma.forms.findFirst({
						where: { id: params.id, userId },
					});
					if (!form) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					return Response.json(form);
				} catch (error) {
					console.error("Error loading form:", error);
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
