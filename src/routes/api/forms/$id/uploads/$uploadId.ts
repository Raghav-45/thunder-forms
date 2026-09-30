import { Readable } from "node:stream";
import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/db";
import { markGoogleDriveConnectionForReauthentication } from "@/features/file-uploads/server/google-drive";
import {
	fileUploadErrorResponse,
	getOwnedFileUploadForm,
} from "@/features/file-uploads/server/owner";
import { getFileStorageProvider } from "@/features/file-uploads/server/storage";
import { FileUploadStatus } from "@/generated/prisma/client";

function contentDisposition(fileName: string) {
	const fallback = fileName.replace(/[^\x20-\x7E]/g, "_").replaceAll('"', "");
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export const Route = createFileRoute("/api/forms/$id/uploads/$uploadId")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				let connectionId: string | null = null;
				try {
					const formId = params.id;
					const uploadId = params.uploadId;
					await getOwnedFileUploadForm(request, formId);
					const upload = await prisma.file_uploads.findFirst({
						where: { id: uploadId, formId, status: FileUploadStatus.ATTACHED },
						include: { destination: { include: { connection: true } } },
					});
					if (!upload) {
						return Response.json({ error: "File not found" }, { status: 404 });
					}
					connectionId = upload.destination.connection.id;

					const stream = await getFileStorageProvider(
						upload.destination.provider,
					).download({
						encryptedRefreshToken:
							upload.destination.connection.encryptedRefreshToken,
						storageKey: upload.storageKey,
					});
					return new Response(
						Readable.toWeb(
							stream as Readable,
						) as unknown as ReadableStream<Uint8Array>,
						{
							headers: {
								"Content-Type": "application/octet-stream",
								"Content-Disposition": contentDisposition(upload.fileName),
								"Cache-Control": "private, no-store",
								"X-Content-Type-Options": "nosniff",
							},
						},
					);
				} catch (error) {
					await markGoogleDriveConnectionForReauthentication(
						connectionId,
						error,
					);
					return fileUploadErrorResponse(error);
				}
			},
		},
	},
});
