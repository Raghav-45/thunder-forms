import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import { encryptGoogleOAuthSecret } from "@/features/google-auth/server/crypto";
import {
	createGoogleSheetsAuthorizationUrl,
	createOAuthAttemptValues,
} from "@/features/google-sheets/server/oauth";
import {
	getOwnedGoogleSheetsForm,
	googleSheetsErrorResponse,
} from "@/features/google-sheets/server/owner";

export const Route = createFileRoute(
	"/api/forms/$id/integrations/google-sheets/connect",
)({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				try {
					const { userId } = await getOwnedGoogleSheetsForm(request, params.id);
					const { state, codeVerifier, codeChallenge } =
						createOAuthAttemptValues();
					await prisma.google_sheets_oauth_attempts.deleteMany({
						where: { userId, formId: params.id },
					});
					await prisma.google_sheets_oauth_attempts.create({
						data: {
							state,
							encryptedCodeVerifier: encryptGoogleOAuthSecret(codeVerifier),
							userId,
							formId: params.id,
							expiresAt: new Date(Date.now() + 10 * 60 * 1000),
						},
					});
					return Response.json({
						authorizationUrl: createGoogleSheetsAuthorizationUrl(
							state,
							codeChallenge,
						),
					});
				} catch (error) {
					return googleSheetsErrorResponse(error);
				}
			},
		},
	},
});
