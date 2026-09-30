import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	findForm: vi.fn(),
	getSessionUserId: vi.fn(),
}));

vi.mock("@/db", () => ({
	prisma: { forms: { findUnique: mocks.findForm, create: mocks.create } },
}));

vi.mock("@/lib/server/session", () => ({
	getSessionUserId: mocks.getSessionUserId,
}));

import { Route } from "./duplicate";

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
						{ id: "name", label: "Name", uniqueIdentifier: "text-input" },
					],
				},
			],
		},
	],
};

const existingForm = (overrides: Record<string, unknown> = {}) => ({
	id: "form-1",
	userId: "user-1",
	title: "Contact form",
	description: "Collect messages",
	fields,
	maxSubmissions: 10,
	expiresAt: null,
	redirectUrl: null,
	submitButtonText: "Send",
	...overrides,
});

describe("POST /api/forms/[id]/duplicate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSessionUserId.mockResolvedValue("user-1");
		mocks.findForm.mockResolvedValue(existingForm());
		mocks.create.mockResolvedValue({ id: "form-copy" });
	});

	it("returns 401 without an authenticated user", async () => {
		mocks.getSessionUserId.mockResolvedValue(null);

		const response = await POST({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findForm).not.toHaveBeenCalled();
	});

	it("returns 404 when source form does not exist", async () => {
		mocks.findForm.mockResolvedValue(null);

		const response = await POST({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Form not found" });
		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("returns 403 when source form belongs to another user", async () => {
		mocks.findForm.mockResolvedValue(existingForm({ userId: "other-user" }));

		const response = await POST({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("returns 422 when source form has invalid stored structure", async () => {
		mocks.findForm.mockResolvedValue(existingForm({ fields: { pages: [] } }));

		const response = await POST({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid form structure",
		});
		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("copies validated source form under authenticated user", async () => {
		const response = await POST({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			success: true,
			id: "form-copy",
		});
		expect(mocks.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: "user-1",
				title: "Contact form (Copy)",
				fields,
				maxSubmissions: 10,
			}),
		});
	});
});
