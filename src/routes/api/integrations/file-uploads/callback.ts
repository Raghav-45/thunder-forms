import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/db";
import { GOOGLE_DRIVE_FILE_SCOPE } from "@/features/file-uploads/constants";
import { createGoogleDriveOAuthClient } from "@/features/file-uploads/server/google-drive";
import {
	decryptGoogleOAuthSecret,
	encryptGoogleOAuthSecret,
} from "@/features/google-auth/server/crypto";
import { FileUploadConnectionStatus } from "@/generated/prisma/client";
import { getSessionUserId } from "@/lib/server/session";

function redirectToBuilder(request: Request, formId: string, result: string) {
	const url = new URL(`/dashboard/builder/${formId}`, request.url);
	url.searchParams.set("fileUploads", result);
	return Response.redirect(url);
}

export const Route = createFileRoute("/api/integrations/file-uploads/callback")(
	{
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
							await transaction.file_upload_oauth_attempts.findUnique({
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
							await transaction.file_upload_oauth_attempts.deleteMany({
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
						const client = createGoogleDriveOAuthClient();
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
						if (!tokenInfo.scopes.includes(GOOGLE_DRIVE_FILE_SCOPE)) {
							return redirectToBuilder(request, attempt.formId, "scope-denied");
						}
						const existing = await prisma.file_upload_connections.findUnique({
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
						const connection = await prisma.file_upload_connections.upsert({
							where: { userId: attempt.userId },
							update: {
								encryptedRefreshToken,
								grantedScopes: tokenInfo.scopes.join(" "),
								status: FileUploadConnectionStatus.ACTIVE,
							},
							create: {
								userId: attempt.userId,
								encryptedRefreshToken,
								grantedScopes: tokenInfo.scopes.join(" "),
								status: FileUploadConnectionStatus.ACTIVE,
							},
						});
						const existingDestination =
							await prisma.file_upload_destinations.findUnique({
								where: {
									formId_fieldId: {
										formId: attempt.formId,
										fieldId: attempt.fieldId,
									},
								},
							});
						if (existingDestination) {
							await prisma.file_upload_destinations.update({
								where: {
									formId_fieldId: {
										formId: attempt.formId,
										fieldId: attempt.fieldId,
									},
								},
								data: { connectionId: connection.id },
							});
						}
						return redirectToBuilder(request, attempt.formId, "connected");
					} catch (error) {
						console.error("Google Drive upload OAuth callback failed:", error);
						return redirectToBuilder(request, attempt.formId, "failed");
					}
				},
			},
		},
	},
);
