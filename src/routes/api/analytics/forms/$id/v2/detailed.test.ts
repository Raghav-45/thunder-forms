import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findForm: vi.fn(),
	queryRaw: vi.fn(),
	getSessionUserId: vi.fn(),
}));

vi.mock("#/db", () => ({
	prisma: { forms: { findUnique: mocks.findForm } },
	analyticsPrisma: { $queryRaw: mocks.queryRaw },
}));

vi.mock("#/lib/server/session", () => ({
	getSessionUserId: mocks.getSessionUserId,
}));

import { Route } from "#/routes/api/analytics/forms/$id/v2/detailed";

const { GET } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					GET: (args: {
						params: { id: string };
						request: Request;
					}) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

const get = (id: string, url = "http://localhost") =>
	GET({ params: { id }, request: new Request(url) });

describe("GET /api/analytics/forms/[id]/v2/detailed", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ANALYTICS_DATABASE_URL =
			"postgresql://localhost:5432/analytics";
		mocks.getSessionUserId.mockResolvedValue("user-1");
		mocks.findForm.mockResolvedValue({ userId: "user-1" });
		mocks.queryRaw.mockResolvedValue([]);
	});

	it("returns 401 without an authenticated user", async () => {
		mocks.getSessionUserId.mockResolvedValue(null);

		const response = await get("form-1");

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findForm).not.toHaveBeenCalled();
	});

	it("returns 404 when form does not exist", async () => {
		mocks.findForm.mockResolvedValue(null);

		const response = await get("form-1");

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Form not found" });
	});

	it("returns 403 when form belongs to another user", async () => {
		mocks.findForm.mockResolvedValue({ userId: "other-user" });

		const response = await get("form-1");

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 500 when analytics DB is not configured", async () => {
		delete process.env.ANALYTICS_DATABASE_URL;

		const response = await get("form-1");

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Analytics DB not configured",
		});
	});

	it("returns 400 for an invalid days parameter", async () => {
		const response = await get("form-1", "http://localhost?days=0");

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid days parameter. Must be a positive integer.",
		});
		expect(mocks.queryRaw).not.toHaveBeenCalled();
	});

	it("returns analytics, daily views, referrers, and breakdowns on success", async () => {
		const response = await get("form-1", "http://localhost?days=90");

		expect(response.status).toBe(200);
		const body = (await response.json()) as Record<string, unknown>;
		expect(body).toMatchObject({
			success: true,
			days: 90,
			analytics: {
				views: 0,
				visits: 0,
				visitors: 0,
				bounces: 0,
				totalTime: 0,
				bounceRate: 0,
				visitDuration: 0,
			},
			dailyViews: [],
			topReferrers: [],
			breakdown: { browser: [], os: [], device: [], country: [], state: [] },
		});
		expect(typeof body.startDate).toBe("string");
		expect(mocks.queryRaw).toHaveBeenCalledTimes(8);
	});

	it("returns 503 when the analytics database is unreachable", async () => {
		mocks.queryRaw.mockRejectedValue(new Error("connect ECONNREFUSED"));

		const response = await get("form-1");

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toEqual({
			error: "Database connection failed",
			detail: "Unable to connect to analytics database",
		});
	});
});
