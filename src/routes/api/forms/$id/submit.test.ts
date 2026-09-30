import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	createDelivery: vi.fn(),
	createResponse: vi.fn(),
	drainGoogleSheetsDeliveries: vi.fn(),
	findUploads: vi.fn(),
	findForm: vi.fn(),
	findUploadSession: vi.fn(),
	transaction: vi.fn(),
	updateUploads: vi.fn(),
}));

vi.mock("@/features/google-sheets/server/deliveries", () => ({
	drainGoogleSheetsDeliveries: mocks.drainGoogleSheetsDeliveries,
}));

vi.mock("@/db", () => ({
	prisma: {
		forms: { findUnique: mocks.findForm },
		responses: { create: mocks.createResponse },
		file_uploads: {
			findMany: mocks.findUploads,
			updateMany: mocks.updateUploads,
		},
		file_upload_sessions: { findFirst: mocks.findUploadSession },
		google_sheets_deliveries: { create: mocks.createDelivery },
		$transaction: mocks.transaction,
	},
}));

import { Route } from "./submit";

const { POST } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					POST: (args: {
						params: { id: string };
						request: Request;
					}) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

const fields = {
	pages: [
		{
			id: "page-1",
			sections: [
				{
					id: "section-1",
					fields: [
						{
							id: "email",
							label: "Email",
							uniqueIdentifier: "text-input",
							inputType: "email",
							required: true,
						},
					],
				},
			],
		},
	],
};

const storedForm = (overrides: Record<string, unknown> = {}) => ({
	id: "form-1",
	fields,
	expiresAt: null,
	maxSubmissions: null,
	_count: { responses: 0 },
	...overrides,
});

const fileFields = {
	pages: [
		{
			id: "page-1",
			sections: [
				{
					id: "section-1",
					fields: [
						{
							id: "portfolio",
							label: "Portfolio",
							uniqueIdentifier: "file-upload",
							maxFiles: 1,
							maxSizeBytes: 5 * 1024 * 1024,
							required: true,
						},
					],
				},
			],
		},
	],
};

const quizFields = {
	quiz: { enabled: true },
	pages: [
		{
			id: "page-1",
			sections: [
				{
					id: "section-1",
					fields: [
						{
							id: "answer",
							label: "Answer",
							uniqueIdentifier: "radio-group",
							options: [
								{ id: "option-a", label: "A", value: "a" },
								{ id: "option-b", label: "B", value: "b" },
							],
							quiz: { correctAnswers: ["a"], points: 2 },
						},
					],
				},
			],
		},
	],
};

const delayedQuizFields = {
	...quizFields,
	quiz: { enabled: true, gradeRelease: "after-review" },
};

const requestFor = (data: unknown, uploadSession?: string) =>
	new Request("http://localhost/api/forms/form-1/submit", {
		method: "POST",
		body: JSON.stringify({ data }),
		headers: {
			"content-type": "application/json",
			...(uploadSession
				? { cookie: `file-upload-session-form-1=${uploadSession}` }
				: {}),
		},
	});

describe("POST /api/forms/[id]/submit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findForm.mockResolvedValue(storedForm());
		mocks.createResponse.mockResolvedValue({
			id: "response-1",
			createdAt: new Date("2026-09-18T00:00:00.000Z"),
		});
		mocks.drainGoogleSheetsDeliveries.mockResolvedValue(1);
		mocks.findUploads.mockResolvedValue([]);
		mocks.updateUploads.mockResolvedValue({ count: 0 });
		mocks.findUploadSession.mockResolvedValue({ id: "session-1" });
		mocks.transaction.mockImplementation(async (callback) =>
			callback({
				forms: { findUnique: mocks.findForm },
				responses: { create: mocks.createResponse },
				file_uploads: {
					findMany: mocks.findUploads,
					updateMany: mocks.updateUploads,
				},
				file_upload_sessions: { findFirst: mocks.findUploadSession },
				google_sheets_deliveries: { create: mocks.createDelivery },
			}),
		);
	});

	it("returns 400 before querying the form for non-object data", async () => {
		const response = await POST({
			params: { id: "form-1" },
			request: requestFor(null),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Form data is required and must be an object",
		});
		expect(mocks.findForm).not.toHaveBeenCalled();
	});

	it("returns 404 when target form does not exist", async () => {
		mocks.findForm.mockResolvedValue(null);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Form not found" });
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("returns 422 when stored form structure is invalid", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: { pages: [] } }));

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "Form structure is invalid",
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("returns 410 when form is expired", async () => {
		mocks.findForm.mockResolvedValue(
			storedForm({ expiresAt: new Date("2000-01-01T00:00:00.000Z") }),
		);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(410);
		await expect(response.json()).resolves.toEqual({
			error: "Form has expired",
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("returns 410 when form has reached submission limit", async () => {
		mocks.findForm.mockResolvedValue(
			storedForm({ maxSubmissions: 1, _count: { responses: 1 } }),
		);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(410);
		await expect(response.json()).resolves.toEqual({
			error: "Form has reached maximum submissions limit",
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("returns field validation errors without writing a response", async () => {
		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "not-an-email" }),
		});

		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toMatchObject({
			error: "Validation failed",
			validationErrors: { email: "Invalid email address" },
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("persists only fields defined by the form schema", async () => {
		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com", isAdmin: true }),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			message: "Form submitted successfully",
			responseId: "response-1",
		});
		expect(mocks.createResponse).toHaveBeenCalledWith({
			data: { formsId: "form-1", data: { email: "person@example.com" } },
		});
	});

	it("scores quiz responses on the server without trusting the browser", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: quizFields }));

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ answer: "a" }),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			message: "Form submitted successfully",
			responseId: "response-1",
			quizResult: { manualScores: {}, pendingPoints: 0, score: 2, maxScore: 2 },
		});
		expect(mocks.createResponse).toHaveBeenCalledWith({
			data: {
				formsId: "form-1",
				data: {
					answer: "a",
					__quiz: { manualScores: {}, pendingPoints: 0, score: 2, maxScore: 2 },
				},
			},
		});
	});

	it("withholds delayed quiz grades until the teacher releases them", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: delayedQuizFields }));

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ answer: "a" }),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			message: "Form submitted successfully",
			responseId: "response-1",
			quizPendingReview: true,
		});
		expect(mocks.createResponse).toHaveBeenCalledWith({
			data: {
				formsId: "form-1",
				data: {
					answer: "a",
					__quiz: { manualScores: {}, pendingPoints: 0, score: 2, maxScore: 2 },
				},
			},
		});
	});

	it("retries a serializable transaction conflict before persisting a response", async () => {
		mocks.transaction
			.mockRejectedValueOnce({ code: "P2034" })
			.mockImplementationOnce(async (callback) =>
				callback({
					forms: { findUnique: mocks.findForm },
					responses: { create: mocks.createResponse },
					file_uploads: {
						findMany: mocks.findUploads,
						updateMany: mocks.updateUploads,
					},
					file_upload_sessions: { findFirst: mocks.findUploadSession },
					google_sheets_deliveries: { create: mocks.createDelivery },
				}),
			);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(201);
		expect(mocks.transaction).toHaveBeenCalledTimes(2);
		expect(mocks.createResponse).toHaveBeenCalledTimes(1);
	});

	it("creates an immutable Sheets delivery with an active integration", async () => {
		mocks.findForm.mockResolvedValue(
			storedForm({
				googleSheetsIntegration: {
					id: "integration-1",
					status: "ACTIVE",
					headers: [
						{ key: "__response_id", label: "Submission ID" },
						{ key: "__submitted_at", label: "Submitted At" },
						{ key: "email", label: "Email" },
					],
				},
			}),
		);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(201);
		expect(mocks.createDelivery).toHaveBeenCalledWith({
			data: {
				integrationId: "integration-1",
				responseId: "response-1",
				row: ["response-1", "2026-09-18T00:00:00.000Z", "person@example.com"],
			},
		});
		// PORT note: TanStack has no Next `after()`; the route drains queued
		// Sheets deliveries fire-and-forget after the 201. Assert the drain seam
		// directly instead of the ORIG `after` callback.
		expect(mocks.drainGoogleSheetsDeliveries).toHaveBeenCalledTimes(1);
	});

	it("does not queue a Sheets delivery while the integration is paused", async () => {
		mocks.findForm.mockResolvedValue(
			storedForm({
				googleSheetsIntegration: {
					id: "integration-1",
					status: "PAUSED",
					headers: [
						{ key: "__response_id", label: "Submission ID" },
						{ key: "__submitted_at", label: "Submitted At" },
						{ key: "email", label: "Email" },
					],
				},
			}),
		);

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({ email: "person@example.com" }),
		});

		expect(response.status).toBe(201);
		expect(mocks.createDelivery).not.toHaveBeenCalled();
		// ORIG asserted `after` was not scheduled on the paused path; PORT drains
		// fire-and-forget gated on shouldSyncGoogleSheets, so assert the drain
		// seam directly instead of the ORIG `after` callback.
		expect(mocks.drainGoogleSheetsDeliveries).not.toHaveBeenCalled();
	});

	it("attaches only pending uploads from the submitted field", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: fileFields }));
		mocks.findUploads.mockResolvedValue([
			{
				id: "upload-1",
				formId: "form-1",
				fieldId: "portfolio",
				fileName: "portfolio.pdf",
				mimeType: "application/pdf",
				sizeBytes: 123,
			},
		]);
		mocks.updateUploads.mockResolvedValue({ count: 1 });

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor(
				{
					portfolio: [
						{
							id: "upload-1",
							name: "forged-name.pdf",
							mimeType: "text/plain",
							sizeBytes: 1,
						},
					],
				},
				"session-1",
			),
		});

		expect(response.status).toBe(201);
		expect(mocks.createResponse).toHaveBeenCalledWith({
			data: {
				formsId: "form-1",
				data: {
					portfolio: [
						{
							id: "upload-1",
							name: "portfolio.pdf",
							mimeType: "application/pdf",
							sizeBytes: 123,
						},
					],
				},
			},
		});
		expect(mocks.updateUploads).toHaveBeenCalledWith({
			where: {
				id: { in: ["upload-1"] },
				formId: "form-1",
				sessionId: "session-1",
				status: "PENDING",
			},
			data: { status: "ATTACHED", responseId: "response-1", sessionId: null },
		});
	});

	it("rejects fabricated upload receipts before writing a response", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: fileFields }));

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor(
				{
					portfolio: [
						{
							id: "not-owned",
							name: "portfolio.pdf",
							mimeType: "application/pdf",
							sizeBytes: 123,
						},
					],
				},
				"session-1",
			),
		});

		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "An uploaded file is invalid or unavailable",
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});

	it("rejects an upload receipt when its browser upload session is absent", async () => {
		mocks.findForm.mockResolvedValue(storedForm({ fields: fileFields }));

		const response = await POST({
			params: { id: "form-1" },
			request: requestFor({
				portfolio: [
					{
						id: "upload-1",
						name: "portfolio.pdf",
						mimeType: "application/pdf",
						sizeBytes: 123,
					},
				],
			}),
		});

		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "Uploaded files are no longer available",
		});
		expect(mocks.createResponse).not.toHaveBeenCalled();
	});
});
