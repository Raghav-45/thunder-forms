import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSessionUserId: vi.fn(),
	getAccessToken: vi.fn(),
	listGoogleForms: vi.fn(),
	importGoogleForm: vi.fn(),
	consumeSession: vi.fn(),
}));

vi.mock("#/lib/server/session", () => ({
	getSessionUserId: mocks.getSessionUserId,
}));

vi.mock("#/features/google-forms-import/server/forms", () => ({
	listGoogleForms: mocks.listGoogleForms,
	importGoogleForm: mocks.importGoogleForm,
}));

vi.mock(
	"#/features/google-forms-import/server/session",
	async (importOriginal) => {
		const original =
			await importOriginal<
				typeof import("#/features/google-forms-import/server/session")
			>();
		return {
			...original,
			getGoogleFormsImportAccessToken: mocks.getAccessToken,
			consumeGoogleFormsImportSession: mocks.consumeSession,
		};
	},
);

import { Route } from "#/routes/api/forms/import-google-form";

const { GET, POST } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					GET: (args: { request: Request }) => Promise<Response>;
					POST: (args: { request: Request }) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

function request(url: string, init?: RequestInit) {
	return new Request(url, init);
}

describe("Google Forms import API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSessionUserId.mockResolvedValue("user-1");
		mocks.getAccessToken.mockResolvedValue("temporary-access-token");
	});

	it("lists forms using only the temporary import authorization", async () => {
		mocks.listGoogleForms.mockResolvedValue({
			forms: [
				{
					id: "form-1",
					title: "Customer survey",
					modifiedTime: null,
					ownedByMe: true,
				},
			],
			nextPageToken: "next-page",
		});

		const response = await GET({
			request: request("http://localhost/api/forms/import-google-form"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			forms: [
				{
					id: "form-1",
					title: "Customer survey",
					modifiedTime: null,
					ownedByMe: true,
				},
			],
			nextPageToken: "next-page",
		});
		expect(mocks.listGoogleForms).toHaveBeenCalledWith(
			"temporary-access-token",
			undefined,
			undefined,
		);
	});

	it("passes a title search to Google Forms listing", async () => {
		mocks.listGoogleForms.mockResolvedValue({ forms: [], nextPageToken: null });

		const response = await GET({
			request: request(
				"http://localhost/api/forms/import-google-form?search=customer%20survey",
			),
		});

		expect(response.status).toBe(200);
		expect(mocks.listGoogleForms).toHaveBeenCalledWith(
			"temporary-access-token",
			undefined,
			"customer survey",
		);
	});

	it("rejects an overly long title search", async () => {
		const response = await GET({
			request: request(
				`http://localhost/api/forms/import-google-form?search=${"a".repeat(201)}`,
			),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Search query is too long",
		});
		expect(mocks.listGoogleForms).not.toHaveBeenCalled();
	});

	it("imports the selected form then consumes the temporary authorization", async () => {
		mocks.importGoogleForm.mockResolvedValue({
			title: "Customer survey",
			description: "",
			pages: [{ fields: [] }],
			skippedItems: [],
		});
		const importRequest = request(
			"http://localhost/api/forms/import-google-form",
			{
				method: "POST",
				body: JSON.stringify({ formId: "form_ABC-123" }),
				headers: { "content-type": "application/json" },
			},
		);

		const response = await POST({ request: importRequest });

		expect(response.status).toBe(200);
		expect(mocks.importGoogleForm).toHaveBeenCalledWith(
			"temporary-access-token",
			"form_ABC-123",
		);
		expect(mocks.consumeSession).toHaveBeenCalledWith(importRequest, "user-1");
	});

	it("rejects an import without a temporary Google authorization", async () => {
		mocks.getAccessToken.mockResolvedValue(null);

		const response = await POST({
			request: request("http://localhost/api/forms/import-google-form", {
				method: "POST",
				body: JSON.stringify({ formId: "form-1" }),
				headers: { "content-type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		expect(mocks.importGoogleForm).not.toHaveBeenCalled();
	});

	it("rejects malformed import requests without calling Google", async () => {
		const response = await POST({
			request: request("http://localhost/api/forms/import-google-form", {
				method: "POST",
				body: "{not-json",
				headers: { "content-type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid import request",
		});
		expect(mocks.importGoogleForm).not.toHaveBeenCalled();
	});

	it("rejects invalid form ids before using the temporary token", async () => {
		const response = await POST({
			request: request("http://localhost/api/forms/import-google-form", {
				method: "POST",
				body: JSON.stringify({ formId: "not a google id" }),
				headers: { "content-type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		expect(mocks.getAccessToken).not.toHaveBeenCalled();
		expect(mocks.importGoogleForm).not.toHaveBeenCalled();
	});
});
