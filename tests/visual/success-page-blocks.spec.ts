import { expect, type Page, test } from "@playwright/test";

async function mockSession(page: Page) {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			json: {
				session: {
					id: "success-session",
					userId: "success-user",
					expiresAt: "2099-01-01T00:00:00.000Z",
					token: "local-test",
				},
				user: {
					id: "success-user",
					name: "Success tester",
					email: "success@example.com",
					emailVerified: true,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				},
			},
		}),
	);
}

test("success page tab previews, edits, and reorders blocks like the form builder", async ({
	page,
}) => {
	test.setTimeout(90_000);
	await mockSession(page);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = route.request().postDataJSON();
		return route.fulfill({
			json: { ...saved, id: "success-form", status: "Active" },
		});
	});
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });

	// A save needs at least one field; the success view does not.
	await page.getByRole("button", { name: "text-input", exact: true }).click();

	const tabs = page.getByRole("navigation", { name: "Form pages" });
	await tabs.getByRole("button", { name: "Success page", exact: true }).click();

	const canvas = page.getByTestId("builder-canvas");
	// Block content is inert (the frame toolbar owns interaction), so assert
	// preview copy by text rather than by control role.
	await expect(canvas.getByRole("heading", { name: "Form Submitted" }))
		.toBeVisible();
	await expect(canvas.getByText("Submit Another Response")).toBeVisible();
	await expect(canvas.getByText("Return to Homepage")).toBeVisible();
	// The form field palette stays on the form view.
	await expect(
		canvas.getByRole("button", { name: "text-input", exact: true }),
	).toHaveCount(0);

	const blockOrder = () =>
		canvas
			.locator("[data-success-block]")
			.evaluateAll((blocks) =>
				blocks.map((block) => block.getAttribute("data-success-block")),
			);
	await expect.poll(blockOrder).toEqual(["title", "message", "buttons"]);

	// Hover reveals the same edit affordance as form fields.
	const titleFrame = canvas.locator('[data-success-block="title"]');
	await titleFrame.hover();
	await titleFrame
		.getByRole("button", { name: "Edit success title", exact: true })
		.click();
	await page
		.getByRole("switch", { name: "Toggle Custom heading section" })
		.click();
	await page
		.getByRole("textbox", { name: "Heading", exact: true })
		.fill("Request received");
	await page.getByRole("button", { name: "Save Changes", exact: true }).click();
	await expect(
		canvas.getByRole("heading", { name: "Request received" }),
	).toBeVisible();

	// Blocks reorder with the same move controls on every frame.
	await titleFrame.hover();
	await titleFrame
		.getByRole("button", { name: "Move success title down", exact: true })
		.click();
	await expect.poll(blockOrder).toEqual(["message", "title", "buttons"]);

	// Drag and drop reorders with the same result as the move buttons.
	const messageFrame = canvas.locator('[data-success-block="message"]');
	const titleBox = await titleFrame.boundingBox();
	const messageBox = await messageFrame.boundingBox();
	if (!titleBox || !messageBox) throw new Error("blocks not measurable");
	const grabX = titleBox.x + 40;
	const grabY = titleBox.y + titleBox.height / 2;
	await page.mouse.move(grabX, grabY);
	await page.mouse.down();
	await page.mouse.move(messageBox.x + 40, messageBox.y + 24, { steps: 15 });
	// The drag floats a full clone of the block, like field re-orders.
	await expect(page.getByText("Request received")).toHaveCount(2);
	await page.mouse.up();
	await expect.poll(blockOrder).toEqual(["title", "message", "buttons"]);

	// The buttons block lists every button with its default: labels change
	// inline, built-ins remove and re-add, link buttons come and go.
	const buttonsFrame = canvas.locator('[data-success-block="buttons"]');
	await buttonsFrame.hover();
	await buttonsFrame
		.getByRole("button", { name: "Edit success buttons", exact: true })
		.click();
	await page
		.getByRole("textbox", { name: "Submit-again button text", exact: true })
		.fill("Respond again");
	await page
		.getByRole("button", { name: "Remove homepage button", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Homepage button", exact: true }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Link button", exact: true })
		.click();
	await page
		.getByRole("textbox", { name: "Button text", exact: true })
		.fill("Help center");
	const urlBox = page.getByRole("textbox", { name: "Link URL", exact: true });
	await urlBox.fill("example.com/help");
	await urlBox.blur();
	await expect(urlBox).toHaveValue("https://example.com/help");
	await page.getByRole("button", { name: "Save Changes", exact: true }).click();

	await expect(canvas.getByText("Respond again")).toBeVisible();
	await expect(canvas.getByText("Return to Homepage")).toHaveCount(0);
	await expect(canvas.getByText("Help center")).toBeVisible();

	// A removed built-in re-adds with its default label.
	await buttonsFrame.hover();
	await buttonsFrame
		.getByRole("button", { name: "Edit success buttons", exact: true })
		.click();
	await page
		.getByRole("button", { name: "Homepage button", exact: true })
		.click();
	await page.getByRole("button", { name: "Save Changes", exact: true }).click();
	await expect(canvas.getByText("Return to Homepage")).toBeVisible();

	const saveResponse = page.waitForResponse(
		(response) =>
			response.url().endsWith("/api/forms/new") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await saveResponse;
	expect(saved).toMatchObject({
		successTitle: "Request received",
		successBlockOrder: ["title", "message", "buttons"],
		submitAnotherResponseText: "Respond again",
		showSubmitAnotherResponse: true,
		showReturnToHomepage: true,
		returnToHomepageText: null,
		successExtraButtons: [
			{
				label: "Help center",
				url: "https://example.com/help",
			},
		],
	});
});
