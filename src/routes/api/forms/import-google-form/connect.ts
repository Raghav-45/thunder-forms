import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import { encryptGoogleOAuthSecret } from "@/features/google-auth/server/crypto";
import {
	createGoogleFormsImportAuthorizationUrl,
	createGoogleFormsImportOAuthAttempt,
} from "@/features/google-forms-import/server/oauth";
import {
	GOOGLE_FORMS_IMPORT_SESSION_MAX_AGE_SECONDS,
	googleFormsImportSessionExpiresAt,
	setGoogleFormsImportCookie,
} from "@/features/google-forms-import/server/session";
import { getSessionUserId } from "@/lib/server/session";

function isBuilderReturnTo(value: unknown): value is string {
	return (
		typeof value === "string" && /^\/dashboard\/builder\/[^/?#]+$/.test(value)
	);
}

export const Route = createFileRoute("/api/forms/import-google-form/connect")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const { returnTo } = await request.json().catch(() => ({}));
					if (!isBuilderReturnTo(returnTo)) {
						return Response.json(
							{ error: "Invalid return location" },
							{ status: 400 },
						);
					}

					const { state, codeVerifier, codeChallenge } =
						createGoogleFormsImportOAuthAttempt();
					const expiresAt = googleFormsImportSessionExpiresAt();

					await prisma.$transaction([
						prisma.google_forms_import_attempts.deleteMany({
							where: {
								OR: [{ userId }, { expiresAt: { lte: new Date() } }],
							},
						}),
						prisma.google_forms_import_attempts.create({
							data: {
								state,
								encryptedCodeVerifier: encryptGoogleOAuthSecret(codeVerifier),
								userId,
								returnTo,
								expiresAt,
							},
						}),
					]);

					return setGoogleFormsImportCookie(
						Response.json({
							authorizationUrl: createGoogleFormsImportAuthorizationUrl(
								state,
								codeChallenge,
							),
						}),
						state,
						GOOGLE_FORMS_IMPORT_SESSION_MAX_AGE_SECONDS,
					);
				} catch (error) {
					console.error("Google Forms import authorization failed:", error);
					return Response.json(
						{ error: "Could not start Google Forms import" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
