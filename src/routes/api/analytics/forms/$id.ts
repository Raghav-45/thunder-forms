import { createFileRoute } from "@tanstack/react-router";

import { analyticsPrisma, prisma } from "#/db";
import { getSessionUserId } from "#/lib/server/session";

export const Route = createFileRoute("/api/analytics/forms/$id")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const { id } = params;

				if (!id) {
					return Response.json({ error: "Missing ID" }, { status: 400 });
				}

				const userId = await getSessionUserId(request);
				if (!userId) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				const form = await prisma.forms.findUnique({
					where: { id },
					select: { userId: true },
				});
				if (!form) {
					return Response.json({ error: "Form not found" }, { status: 404 });
				}
				if (form.userId !== userId) {
					return Response.json({ error: "Unauthorized" }, { status: 403 });
				}

				if (!process.env.ANALYTICS_DATABASE_URL) {
					return Response.json(
						{ error: "Analytics DB not configured" },
						{ status: 500 },
					);
				}

				try {
					const logs = await analyticsPrisma.$queryRaw`
            SELECT "event_id", "session_id", "visit_id", "created_at", "url_path", "event_type"
            FROM "website_event"
            WHERE "url_path" ILIKE ${`/forms/${id}%`}
            ORDER BY "created_at" DESC
          `;

					return Response.json(
						{ success: true, analytics: logs },
						{ status: 200 },
					);
				} catch (error) {
					console.error("Analytics fetch error for all time:", error);
					return Response.json(
						{ error: "Failed to fetch analytics for all time" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
