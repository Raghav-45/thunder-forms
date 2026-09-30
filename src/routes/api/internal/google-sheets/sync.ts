import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { GOOGLE_SHEETS_SYNC_BATCH_LIMIT } from "@/features/google-sheets/constants";
import { getGoogleSheetsSyncSecret } from "@/features/google-sheets/server/config";
import { drainGoogleSheetsDeliveries } from "@/features/google-sheets/server/deliveries";

function isAuthorized(request: Request): boolean {
	try {
		return (
			request.headers.get("authorization") ===
			`Bearer ${getGoogleSheetsSyncSecret()}`
		);
	} catch {
		return false;
	}
}

export const Route = createFileRoute("/api/internal/google-sheets/sync")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				if (!isAuthorized(request)) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				try {
					const body = await request.json().catch(() => ({}));
					const limit =
						typeof (body as { limit?: unknown }).limit === "number"
							? Math.max(
									1,
									Math.min(
										Math.floor((body as { limit: number }).limit),
										GOOGLE_SHEETS_SYNC_BATCH_LIMIT,
									),
								)
							: GOOGLE_SHEETS_SYNC_BATCH_LIMIT;
					const claimed = await drainGoogleSheetsDeliveries(
						randomUUID(),
						limit,
					);
					return Response.json({ claimed });
				} catch (error) {
					console.error("Google Sheets sync worker failed:", error);
					return Response.json(
						{ error: "Google Sheets sync failed" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
