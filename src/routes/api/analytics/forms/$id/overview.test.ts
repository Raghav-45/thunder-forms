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

import { Route } from "#/routes/api/analytics/forms/$id/overview";

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

const get = (id: string) =>
	GET({ params: { id }, request: new Request("http://localhost") });

describe("GET /api/analytics/forms/[id]/overview", () => {
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

	it("returns zeroed metrics when there are no logs", async () => {
		const response = await get("form-1");

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			analytics: {
				views: 0,
				visits: 0,
				visitors: 0,
				bounceRate: 0,
				visitDuration: 0,
			},
		});
	});

	it("aggregates views, visits, visitors, bounce rate, and duration", async () => {
		mocks.queryRaw.mockResolvedValue([
			{
				event_id: "e1",
				session_id: "s1",
				visit_id: "v1",
				created_at: "2026-01-01T10:00:00.000Z",
				url_path: "/forms/form-1",
				event_type: "pageview",
			},
			{
				event_id: "e2",
				session_id: "s1",
				visit_id: "v1",
				created_at: "2026-01-01T10:01:00.000Z",
				url_path: "/forms/form-1",
				event_type: "pageview",
			},
			{
				event_id: "e3",
				session_id: "s2",
				visit_id: "v2",
				created_at: "2026-01-01T11:00:00.000Z",
				url_path: "/forms/form-1",
				event_type: "pageview",
			},
		]);

		const response = await get("form-1");

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			analytics: {
				views: 3,
				visits: 2,
				visitors: 2,
				bounceRate: 50,
				visitDuration: 60,
			},
		});
	});
});
