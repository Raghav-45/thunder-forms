import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findForm: vi.fn(),
}));

vi.mock("@/db", () => ({
	prisma: { forms: { findUnique: mocks.findForm } },
}));

import { Route } from "./viewForm";

const { GET } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					GET: (args: {
						params: { id: string };
						request?: Request;
					}) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

describe("GET /api/forms/[id]/viewForm", () => {
	it("does not expose quiz answer keys to respondents", async () => {
		mocks.findForm.mockResolvedValue({
			id: "form-1",
			userId: "owner-1",
			maxSubmissions: null,
			expiresAt: null,
			_count: { responses: 0 },
			fields: {
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
			},
		});

		const response = await GET({ params: { id: "form-1" } });

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toMatchObject({
			fields: {
				quiz: { enabled: true },
				pages: [
					{
						sections: [
							{
								fields: [{ id: "answer" }],
							},
						],
					},
				],
			},
		});
		expect(body.fields.pages[0].sections[0].fields[0]).not.toHaveProperty(
			"quiz",
		);
	});
});
