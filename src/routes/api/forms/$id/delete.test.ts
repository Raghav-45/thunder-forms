import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	deleteForm: vi.fn(),
	findForm: vi.fn(),
	getSessionUserId: vi.fn(),
}));

vi.mock("#/db", () => ({
	prisma: { forms: { findUnique: mocks.findForm, delete: mocks.deleteForm } },
}));

vi.mock("#/lib/server/session", () => ({
	getSessionUserId: mocks.getSessionUserId,
}));

import { Route } from "#/routes/api/forms/$id/delete";

const { DELETE } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					DELETE: (args: {
						params: { id: string };
						request: Request;
					}) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

describe("DELETE /api/forms/[id]/delete", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSessionUserId.mockResolvedValue("user-1");
		mocks.findForm.mockResolvedValue({ userId: "user-1" });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns 401 without an authenticated user", async () => {
		mocks.getSessionUserId.mockResolvedValue(null);

		const response = await DELETE({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findForm).not.toHaveBeenCalled();
	});

	it("returns 404 when form does not exist", async () => {
		mocks.findForm.mockResolvedValue(null);

		const response = await DELETE({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Form not found" });
		expect(mocks.deleteForm).not.toHaveBeenCalled();
	});

	it("returns 403 when authenticated user does not own form", async () => {
		mocks.findForm.mockResolvedValue({ userId: "other-user" });

		const response = await DELETE({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.deleteForm).not.toHaveBeenCalled();
	});

	it("deletes only form confirmed to belong to authenticated user", async () => {
		const response = await DELETE({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBe("form-1");
		expect(mocks.deleteForm).toHaveBeenCalledWith({ where: { id: "form-1" } });
	});

	it("returns 500 without exposing database errors outside development", async () => {
		vi.stubEnv("NODE_ENV", "production");
		mocks.deleteForm.mockRejectedValue(new Error("database unavailable"));

		const response = await DELETE({
			params: { id: "form-1" },
			request: new Request("http://localhost"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Database error occurred",
		});
	});
});
