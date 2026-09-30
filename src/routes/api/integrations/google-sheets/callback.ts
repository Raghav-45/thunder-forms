import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/db";
import {
	decryptGoogleOAuthSecret,
	encryptGoogleOAuthSecret,
} from "@/features/google-auth/server/crypto";
import {
	GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM,
	GOOGLE_SHEETS_SCOPE,
} from "@/features/google-sheets/constants";
import { createGoogleSheetsOAuthClient } from "@/features/google-sheets/server/oauth";
import { GoogleSheetsConnectionStatus } from "@/generated/prisma/client";
import { getSessionUserId } from "@/lib/server/session";

function redirectToBuilder(request: Request, formId: string, result: string) {
	const url = new URL(`/dashboard/builder/${formId}`, request.url);
	url.searchParams.set(GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM, result);
	return Response.redirect(url);
}

function callbackFailureResult(error: unknown): string {
	return error instanceof Error && error.message === "invalid_client"
		? "invalid-client"
		: "failed";
}

export const Route = createFileRoute(
	"/api/integrations/google-sheets/callback",
)({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const state = url.searchParams.get("state");
				const code = url.searchParams.get("code");
				const providerError = url.searchParams.get("error");
				if (!state)
					return Response.redirect(new URL("/dashboard", request.url));

				const userId = await getSessionUserId(request);
				if (!userId)
					return Response.redirect(new URL("/dashboard", request.url));

				const attempt = await prisma.$transaction(async (transaction) => {
					const candidate =
						await transaction.google_sheets_oauth_attempts.findUnique({
							where: { state },
						});
					if (
						!candidate ||
						candidate.userId !== userId ||
						candidate.expiresAt <= new Date()
					) {
						return null;
					}
					const consumed =
						await transaction.google_sheets_oauth_attempts.deleteMany({
							where: { state, userId, expiresAt: { gt: new Date() } },
						});
					return consumed.count === 1 ? candidate : null;
				});
				if (!attempt)
					return Response.redirect(new URL("/dashboard", request.url));

				try {
					if (providerError || !code) {
						return redirectToBuilder(
							request,
							attempt.formId,
							providerError ? "denied" : "failed",
						);
					}

					const client = createGoogleSheetsOAuthClient();
					const { tokens } = await client.getToken({
						code,
						codeVerifier: decryptGoogleOAuthSecret(
							attempt.encryptedCodeVerifier,
						),
					});
					if (!tokens.access_token) {
						return redirectToBuilder(request, attempt.formId, "scope-denied");
					}
					const tokenInfo = await client.getTokenInfo(tokens.access_token);
					if (!tokenInfo.scopes.includes(GOOGLE_SHEETS_SCOPE)) {
						return redirectToBuilder(request, attempt.formId, "scope-denied");
					}

					const existing = await prisma.google_sheets_connections.findUnique({
						where: { userId: attempt.userId },
					});
					const encryptedRefreshToken = tokens.refresh_token
						? encryptGoogleOAuthSecret(tokens.refresh_token)
						: existing?.encryptedRefreshToken;
					if (!encryptedRefreshToken) {
						return redirectToBuilder(
							request,
							attempt.formId,
							"missing-refresh-token",
						);
					}

					await prisma.google_sheets_connections.upsert({
						where: { userId: attempt.userId },
						update: {
							encryptedRefreshToken,
							grantedScopes:
								tokenInfo.scopes.join(" ") || existing?.grantedScopes || "",
							status: GoogleSheetsConnectionStatus.ACTIVE,
						},
						create: {
							userId: attempt.userId,
							encryptedRefreshToken,
							grantedScopes: tokenInfo.scopes.join(" "),
							status: GoogleSheetsConnectionStatus.ACTIVE,
						},
					});
					return redirectToBuilder(request, attempt.formId, "connected");
				} catch (error) {
					console.error("Google Sheets OAuth callback failed:", error);
					return redirectToBuilder(
						request,
						attempt.formId,
						callbackFailureResult(error),
					);
				}
			},
		},
	},
});
