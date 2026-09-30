import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findForms: vi.fn(),
	queryRawUnsafe: vi.fn(),
	getSessionUserId: vi.fn(),
}));

vi.mock("@/db", () => ({
	prisma: { forms: { findMany: mocks.findForms } },
	analyticsPrisma: { $queryRawUnsafe: mocks.queryRawUnsafe },
}));

vi.mock("@/lib/server/session", () => ({
	getSessionUserId: mocks.getSessionUserId,
}));

import { Route } from "./overview";

const { GET } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					GET: (args: { request: Request }) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

const get = () => GET({ request: new Request("http://localhost") });

describe("GET /api/analytics/overview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSessionUserId.mockResolvedValue("user-1");
		mocks.findForms.mockResolvedValue([]);
		mocks.queryRawUnsafe.mockResolvedValue([]);
	});

	it("returns 401 without an authenticated user", async () => {
		mocks.getSessionUserId.mockResolvedValue(null);

		const response = await get();

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			error: "Authentication error",
		});
		expect(mocks.findForms).not.toHaveBeenCalled();
	});

	it("returns zeroed analytics when the user has no forms", async () => {
		const response = await get();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			analytics: {
				totalViews: 0,
				totalVisits: 0,
				totalVisitors: 0,
				totalForms: 0,
				totalResponses: 0,
				averageBounceRate: 0,
				averageVisitDuration: 0,
				timeSeriesData: [],
			},
		});
		expect(mocks.queryRawUnsafe).not.toHaveBeenCalled();
	});

	it("returns 500 when a form id falls outside the cuid alphabet", async () => {
		mocks.findForms.mockResolvedValue([
			{ id: "not a cuid!", _count: { responses: 0 } },
		]);

		const response = await get();

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch overall analytics",
		});
		expect(mocks.queryRawUnsafe).not.toHaveBeenCalled();
	});

	it("aggregates overall analytics across user forms", async () => {
		mocks.findForms.mockResolvedValue([
			{ id: "cabc123", _count: { responses: 2 } },
			{ id: "cdef456", _count: { responses: 3 } },
		]);
		mocks.queryRawUnsafe.mockResolvedValue([]);

		const response = await get();

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			success: boolean;
			analytics: Record<string, unknown>;
		};
		expect(body).toMatchObject({
			success: true,
			analytics: {
				totalViews: 0,
				totalVisits: 0,
				totalVisitors: 0,
				totalForms: 2,
				totalResponses: 5,
			},
		});
	});
});
