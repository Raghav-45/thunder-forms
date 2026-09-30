import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	download: vi.fn(),
	findFirst: vi.fn(),
	getOwnedFileUploadForm: vi.fn(),
}));

vi.mock("@/db", () => ({
	prisma: {
		file_uploads: { findFirst: mocks.findFirst },
	},
}));

vi.mock("@/features/file-uploads/server/owner", () => ({
	fileUploadErrorResponse: vi.fn(),
	getOwnedFileUploadForm: mocks.getOwnedFileUploadForm,
}));

vi.mock("@/features/file-uploads/server/storage", () => ({
	getFileStorageProvider: () => ({ download: mocks.download }),
}));

vi.mock("@/features/file-uploads/server/google-drive", () => ({
	markGoogleDriveConnectionForReauthentication: vi.fn(),
}));

import { Route } from "./$uploadId";

const { GET } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					GET: (args: {
						params: { id: string; uploadId: string };
						request: Request;
					}) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

describe("GET /api/forms/[id]/uploads/[uploadId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getOwnedFileUploadForm.mockResolvedValue({ id: "form-1" });
		mocks.findFirst.mockResolvedValue({
			id: "upload-1",
			fileName: "report.pdf",
			mimeType: "text/html",
			storageKey: "drive-file-1",
			destination: {
				provider: "google-drive",
				connection: { id: "connection-1", encryptedRefreshToken: "token" },
			},
		});
		mocks.download.mockResolvedValue(Readable.from(["file contents"]));
	});

	it("forces downloaded files to be treated as binary attachments", async () => {
		const response = await GET({
			params: { id: "form-1", uploadId: "upload-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"application/octet-stream",
		);
		expect(response.headers.get("content-disposition")).toContain(
			"attachment;",
		);
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
	});
});
