import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "#/db";
import { getGoogleDriveAccessToken } from "#/features/file-uploads/server/google-drive";
import {
	fileUploadErrorResponse,
	getOwnedFileUploadField,
} from "#/features/file-uploads/server/owner";
import { FileUploadConnectionStatus } from "#/generated/prisma/client";

export const Route = createFileRoute(
	"/api/forms/$id/uploads/fields/$fieldId/picker-token",
)({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				try {
					const { userId } = await getOwnedFileUploadField(
						request,
						params.id,
						params.fieldId,
					);
					const connection = await prisma.file_upload_connections.findUnique({
						where: { userId },
					});
					if (connection?.status !== FileUploadConnectionStatus.ACTIVE) {
						return Response.json(
							{ error: "Connect Google Drive before choosing a folder" },
							{ status: 409 },
						);
					}
					return Response.json(
						{
							accessToken: await getGoogleDriveAccessToken(
								connection.encryptedRefreshToken,
							),
						},
						{ headers: { "Cache-Control": "no-store" } },
					);
				} catch (error) {
					return fileUploadErrorResponse(error);
				}
			},
		},
	},
});
