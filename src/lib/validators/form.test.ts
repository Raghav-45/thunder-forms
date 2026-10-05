import { afterEach, describe, expect, it, vi } from "vitest";
import {
	FormValidator,
	normalizeSuccessBlockOrder,
} from "#/lib/validators/form";

const validPayload = {
	title: "Contact form",
	fields: { pages: [] },
};

describe("FormValidator", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("accepts a complete valid payload", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));

		expect(
			FormValidator.parse({
				...validPayload,
				description: "Collect contact requests",
				maxSubmissions: 25,
				expiresAt: "2030-06-01T00:00:00.000Z",
				redirectUrl: "https://example.com/thanks",
				submitButtonText: "Send request",
			}),
		).toMatchObject({
			title: "Contact form",
			maxSubmissions: 25,
			redirectUrl: "https://example.com/thanks",
		});
	});

	it("rejects a title shorter than two characters", () => {
		const result = FormValidator.safeParse({ ...validPayload, title: "A" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({
					path: ["title"],
					message: "Title is required",
				}),
			);
		}
	});

	it.each([
		0, -1, 1.5,
	])("rejects invalid submission limit %s", (maxSubmissions) => {
		expect(
			FormValidator.safeParse({ ...validPayload, maxSubmissions }).success,
		).toBe(false);
	});

	it("accepts a null submission limit", () => {
		expect(
			FormValidator.safeParse({ ...validPayload, maxSubmissions: null })
				.success,
		).toBe(true);
	});

	it("rejects an expiration date that is not in the future", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));

		const result = FormValidator.safeParse({
			...validPayload,
			expiresAt: "2030-01-01T00:00:00.000Z",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({
					path: ["expiresAt"],
					message: "Expiration date must be in the future",
				}),
			);
		}
	});

	it("rejects an invalid redirect URL and an overlong submit label", () => {
		const result = FormValidator.safeParse({
			...validPayload,
			redirectUrl: "not a URL",
			submitButtonText: "x".repeat(51),
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["redirectUrl"],
						message: "Must be a valid URL",
					}),
					expect.objectContaining({
						path: ["submitButtonText"],
						message: "Must be 50 characters or less",
					}),
				]),
			);
		}
	});

	it("accepts success-page button labels, visibility, and extra buttons", () => {
		const result = FormValidator.safeParse({
			...validPayload,
			submitAnotherResponseText: "Respond again",
			returnToHomepageText: "Back home",
			showSubmitAnotherResponse: false,
			showReturnToHomepage: true,
			successExtraButtons: [
				{
					id: "extra_1",
					label: "Help center",
					url: "https://example.com/help",
				},
			],
			successTitle: "Request received",
			successMessage: "We will reply within two days.",
			successBlockOrder: ["buttons", "title", "message"],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toMatchObject({
				submitAnotherResponseText: "Respond again",
				showSubmitAnotherResponse: false,
				successTitle: "Request received",
			});
		}
	});

	it("rejects invalid success-page button settings", () => {
		const result = FormValidator.safeParse({
			...validPayload,
			submitAnotherResponseText: "x".repeat(51),
			returnToHomepageText: "x".repeat(51),
			successExtraButtons: [
				{ id: "", label: "", url: "not a URL" },
				...Array.from({ length: 10 }, (_, index) => ({
					id: `extra_${index}`,
					label: "Extra",
					url: "https://example.com",
				})),
			],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["submitAnotherResponseText"],
						message: "Must be 50 characters or less",
					}),
					expect.objectContaining({
						path: ["returnToHomepageText"],
						message: "Must be 50 characters or less",
					}),
					expect.objectContaining({
						path: ["successExtraButtons"],
						message: "At most 10 extra buttons are allowed",
					}),
				]),
			);
		}
	});

	it("rejects overlong success title, message, and block order", () => {
		const result = FormValidator.safeParse({
			...validPayload,
			successTitle: "x".repeat(101),
			successMessage: "x".repeat(1001),
			successBlockOrder: ["title", "message", "buttons", "title"],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["successTitle"],
						message: "Must be 100 characters or less",
					}),
					expect.objectContaining({
						path: ["successMessage"],
						message: "Must be 1000 characters or less",
					}),
					expect.objectContaining({
						path: ["successBlockOrder"],
						message: "At most 3 blocks are allowed",
					}),
				]),
			);
		}
	});

	it("normalizes stored block orders to the default block set", () => {
		expect(normalizeSuccessBlockOrder(undefined)).toEqual([
			"title",
			"message",
			"buttons",
		]);
		expect(normalizeSuccessBlockOrder(["buttons"])).toEqual([
			"buttons",
			"title",
			"message",
		]);
		expect(
			normalizeSuccessBlockOrder(["message", "message", "unknown", "title"]),
		).toEqual(["message", "title", "buttons"]);
	});
});
