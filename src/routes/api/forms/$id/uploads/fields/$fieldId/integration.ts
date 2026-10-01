import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "#/db";
import {
	fileUploadErrorResponse,
	getOwnedFileUploadField,
} from "#/features/file-uploads/server/owner";
import { FileUploadConnectionStatus } from "#/generated/prisma/client";

export const Route = createFileRoute(
	"/api/forms/$id/uploads/fields/$fieldId/integration",
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
					const [connection, destination] = await Promise.all([
						prisma.file_upload_connections.findUnique({ where: { userId } }),
						prisma.file_upload_destinations.findUnique({
							where: {
								formId_fieldId: { formId: params.id, fieldId: params.fieldId },
							},
						}),
					]);
					return Response.json({
						connection: connection ? { status: connection.status } : null,
						destination: destination
							? { folderName: destination.folderName }
							: null,
						ready:
							connection?.status === FileUploadConnectionStatus.ACTIVE &&
							Boolean(destination),
					});
				} catch (error) {
					return fileUploadErrorResponse(error);
				}
			},
		},
	},
});
