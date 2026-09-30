import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/db";
import { GOOGLE_DRIVE_STORAGE_PROVIDER } from "@/features/file-uploads/constants";
import { getGoogleDriveFolder } from "@/features/file-uploads/server/google-drive";
import {
	fileUploadErrorResponse,
	getOwnedFileUploadField,
} from "@/features/file-uploads/server/owner";
import { FileUploadConnectionStatus } from "@/generated/prisma/client";

export const Route = createFileRoute(
	"/api/forms/$id/uploads/fields/$fieldId/selection",
)({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				try {
					const body = await request.json();
					const folderId = body?.folderId;
					if (typeof folderId !== "string" || !folderId) {
						return Response.json(
							{ error: "Google Drive folder is required" },
							{ status: 400 },
						);
					}
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
					const folder = await getGoogleDriveFolder(
						connection.encryptedRefreshToken,
						folderId,
					);
					const destination = await prisma.file_upload_destinations.upsert({
						where: {
							formId_fieldId: { formId: params.id, fieldId: params.fieldId },
						},
						update: {
							connectionId: connection.id,
							provider: GOOGLE_DRIVE_STORAGE_PROVIDER,
							folderId: folder.folderId,
							folderName: folder.folderName,
						},
						create: {
							formId: params.id,
							fieldId: params.fieldId,
							connectionId: connection.id,
							provider: GOOGLE_DRIVE_STORAGE_PROVIDER,
							folderId: folder.folderId,
							folderName: folder.folderName,
						},
					});
					return Response.json({ folderName: destination.folderName });
				} catch (error) {
					return fileUploadErrorResponse(error);
				}
			},
		},
	},
});
