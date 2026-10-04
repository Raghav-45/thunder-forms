import { expect, type Page, type Route, test } from "@playwright/test";
import type { GeneratedForm } from "#/features/form-builder/core/generated-form";
import type { FormStructure } from "#/features/form-builder/form-structure";

const GENERATED_FORM = {
	title: "Community meetup RSVP",
	description: "Plan attendance for the next meetup.",
	fields: {
		pages: [
			{
				id: "meetup_page",
				sections: [
					{
						id: "meetup_section",
						fields: [
							{
								id: "meetup_name",
								uniqueIdentifier: "text-input",
								label: "Full name",
								required: true,
								disabled: false,
								inputType: "text",
							},
						],
					},
				],
			},
		],
	},
	meta: { responseTime: "1ms", responseTimeSeconds: "0.00s" },
};

async function mount(page: Page) {
	await page.goto("/auth", { waitUntil: "networkidle" });
	await page.evaluate(async () => {
		const load = (path: string) => import(/* @vite-ignore */ path);
		const source = await fetch(
			"/src/features/form-builder/core/generate-with-ai.tsx",
		).then((response) => response.text());
		const reactPath = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
		if (!reactPath) throw new Error("Missing React dependency");
		const [React, client, generator] = await Promise.all([
			load(reactPath),
			load("/node_modules/.vite/deps/react-dom_client.js"),
			load("/src/features/form-builder/core/generate-with-ai.tsx"),
		]);
		const host = document.createElement("div");
		document.body.replaceChildren(host);
		const e = React.default.createElement;
		function Fixture() {
			const [result, setResult] = React.default.useState("");
			const [options, setOptions] = React.default.useState(null);
			return e(
				React.default.Fragment,
				null,
				e(generator.default, {
					onGeneratedForm: (form: GeneratedForm) => {
						const fieldCount = form.fields.pages.reduce(
							(total, page) =>
								total +
								page.sections.reduce(
									(sectionTotal, section) =>
										sectionTotal + section.fields.length,
									0,
								),
							0,
						);
						setResult(
							`${form.title}: ${form.description} (${fieldCount} fields)`,
						);
						setOptions({ submitButtonText: form.submitButtonText });
					},
				}),
				e("output", null, result),
				e(
					"pre",
					{ "data-testid": "generated-options" },
					JSON.stringify(options),
				),
			);
		}
		client.default.createRoot(host).render(e(Fixture));
	});
}

test("AI dialog keeps generation in context and recovers from API errors", async ({
	page,
}) => {
	let shouldFail = false;
	let requestedPrompt = "";
	let finishGeneration = () => {};
	const pendingGeneration = new Promise<void>((resolve) => {
		finishGeneration = resolve;
	});
	await page.route("**/api/generatewithai", async (route) => {
		requestedPrompt = route.request().postDataJSON().prompt;
		if (shouldFail) {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ error: "AI generation is not configured" }),
			});
			return;
		}
		await pendingGeneration;
		await route.fulfill({
			contentType: "application/json",
			body: JSON.stringify(GENERATED_FORM),
		});
	});
	await mount(page);

	const trigger = page.getByRole("button", { name: /Generate with AI/ });
	await trigger.click();
	const dialog = page.getByRole("dialog");
	const prompt = dialog.getByRole("textbox", {
		name: "Describe the form you want to build",
	});
	const [dialogBox, promptBox] = await Promise.all([
		dialog.boundingBox(),
		prompt.boundingBox(),
	]);
	expect(dialogBox).not.toBeNull();
	expect(promptBox).not.toBeNull();
	const dialogCenterY = (dialogBox?.y ?? 0) + (dialogBox?.height ?? 0) / 2;
	expect(
		Math.abs(dialogCenterY - page.viewportSize()!.height / 2),
	).toBeLessThan(2);
	await expect(
		dialog.getByRole("heading", {
			name: "Generate with AI",
		}),
	).toBeVisible();
	await expect(dialog.getByRole("button", { name: "Generate" })).toBeDisabled();

	await dialog
		.getByRole("button", {
			name: /Event registration/,
		})
		.click();
	await expect(prompt).toHaveValue(
		"An event registration form with ticket types and dietary needs",
	);
	await dialog.getByRole("tab", { name: "Options" }).click();
	const optionsPromptBox = await prompt.boundingBox();
	expect(optionsPromptBox?.y).toBe(promptBox?.y);
	await dialog.getByRole("button", { name: "Detailed" }).click();
	await expect(
		dialog.getByRole("button", { name: "Split into steps" }),
	).toHaveCount(0);
	await expect(
		dialog.getByRole("button", { name: "Conditional logic" }),
	).toHaveCount(0);
	await expect(
		dialog.getByRole("button", { name: "Quiz", exact: true }),
	).toHaveCount(0);
	await dialog.getByRole("tab", { name: "Suggested" }).click();
	await dialog.getByRole("button", { name: "Generate" }).click();
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("Understanding your prompt…");
	finishGeneration();
	await expect(page.locator("output")).toHaveText(
		"Community meetup RSVP: Plan attendance for the next meetup. (1 fields)",
	);
	expect(requestedPrompt).toContain("Use a detailed level of detail.");
	expect(requestedPrompt).toContain(
		"only when the request does not already specify",
	);
	await expect(dialog).toHaveCount(0);

	shouldFail = true;
	await trigger.click();
	await prompt.fill("Create a customer feedback form.");
	await prompt.press("Enter");
	await expect(dialog).toContainText("AI generation is not configured");
	await expect(prompt).toBeEnabled();
	await expect(prompt).toHaveValue("Create a customer feedback form.");
	await expect(dialog.getByRole("button", { name: "Generate" })).toBeEnabled();
	expect(requestedPrompt).toBe("Create a customer feedback form.");

	shouldFail = false;
	await prompt.press("Enter");
	await expect(dialog).toHaveCount(0);
	await expect(page.locator("output")).toHaveText(
		"Community meetup RSVP: Plan attendance for the next meetup. (1 fields)",
	);
});

test("AI dialog rejects an obsolete response and allows retry with the save contract", async ({
	page,
}) => {
	let validResponse = false;
	await page.route("**/api/generatewithai", (route) =>
		route.fulfill({
			contentType: "application/json",
			body: JSON.stringify(
				validResponse
					? GENERATED_FORM
					: {
							title: GENERATED_FORM.title,
							description: GENERATED_FORM.description,
							structure: GENERATED_FORM.fields,
							meta: GENERATED_FORM.meta,
						},
			),
		}),
	);
	await mount(page);
	await page.getByRole("button", { name: /Generate with AI/ }).click();
	const dialog = page.getByRole("dialog");
	const prompt = dialog.getByRole("textbox", {
		name: "Describe the form you want to build",
	});
	await prompt.fill("Create a meetup RSVP form.");
	await prompt.press("Enter");
	await expect(dialog).toContainText("AI returned an invalid form structure");
	await expect(page.locator("output")).toBeEmpty();
	await expect(prompt).toHaveValue("Create a meetup RSVP form.");
	await expect(prompt).toBeEnabled();
	validResponse = true;
	await prompt.press("Enter");
	await expect(dialog).toHaveCount(0);
	await expect(page.locator("output")).toHaveText(
		"Community meetup RSVP: Plan attendance for the next meetup. (1 fields)",
	);
});

test("template choices use canonical templates and preserve returned settings", async ({
	page,
}) => {
	const requestedPrompts: string[] = [];
	await page.route("**/api/generatewithai", (route) => {
		requestedPrompts.push(route.request().postDataJSON().prompt);
		return route.fulfill({
			contentType: "application/json",
			body: JSON.stringify({
				...GENERATED_FORM,
				submitButtonText: "Send message",
			}),
		});
	});
	await mount(page);
	const trigger = page.getByRole("button", { name: /Generate with AI/ });
	await trigger.click();
	const dialog = page.getByRole("dialog");
	const prompt = dialog.getByRole("textbox", {
		name: "Describe the form you want to build",
	});
	await dialog.getByRole("tab", { name: /Options/ }).click();
	await dialog.getByRole("button", { name: "Detailed" }).click();
	await dialog.getByRole("tab", { name: /Templates/ }).click();
	for (const title of [
		"Contact Us",
		"Customer Feedback",
		"Job Application",
		"Event RSVP",
		"Product Survey",
		"Support Ticket",
	]) {
		await expect(
			dialog.getByRole("button", { name: new RegExp(title) }),
		).toBeVisible();
	}
	await expect(
		dialog.getByRole("button", {
			name: /Order form|Employee onboarding|Speaker submission|Quiz/,
		}),
	).toHaveCount(0);
	await dialog.getByRole("button", { name: "Contact", exact: true }).click();
	await dialog.getByRole("button", { name: /Contact Us/ }).click();
	const templatePrompt =
		"Use the Contact Us template (slug: contact-us) without modifications.";
	await expect(prompt).toHaveValue(templatePrompt);
	await dialog.getByRole("button", { name: "Generate", exact: true }).click();
	await expect(dialog).toHaveCount(0);
	expect(requestedPrompts).toEqual([templatePrompt]);
	await expect(page.getByTestId("generated-options")).toHaveText(
		JSON.stringify({ submitButtonText: "Send message" }),
	);

	await trigger.click();
	const modifiedTemplatePrompt =
		"Use the Customer Feedback template and add 7 text fields.";
	await prompt.fill(modifiedTemplatePrompt);
	await prompt.press("Enter");
	await expect(dialog).toHaveCount(0);
	expect(requestedPrompts[1]).toBe(modifiedTemplatePrompt);
});

test("closing a pending generation cancels it and permits a new request", async ({
	page,
}) => {
	let capturePending = (_route: Route) => {};
	const pendingRequest = new Promise<Route>((resolve) => {
		capturePending = resolve;
	});
	let requestCount = 0;
	await page.route("**/api/generatewithai", (route) => {
		requestCount += 1;
		if (requestCount === 1) {
			capturePending(route);
			return;
		}
		return route.fulfill({
			contentType: "application/json",
			body: JSON.stringify(GENERATED_FORM),
		});
	});
	await mount(page);
	const trigger = page.getByRole("button", { name: /Generate with AI/ });
	await trigger.click();
	const dialog = page.getByRole("dialog");
	const prompt = dialog.getByRole("textbox", {
		name: "Describe the form you want to build",
	});
	await prompt.fill("Generate the old form.");
	await prompt.press("Enter");
	const staleRoute = await pendingRequest;
	await expect(dialog).toContainText("Understanding your prompt…");
	const canceledRequest = page.waitForEvent("requestfailed", (request) =>
		request.url().endsWith("/api/generatewithai"),
	);
	await page.keyboard.press("Escape");
	await expect(dialog).toHaveCount(0);
	await trigger.click();
	await expect(prompt).toHaveValue("");
	await expect(prompt).toBeEnabled();
	await staleRoute.fulfill({
		contentType: "application/json",
		body: JSON.stringify({ ...GENERATED_FORM, title: "Canceled form" }),
	});
	await canceledRequest;
	await expect(page.locator("output")).toBeEmpty();
	await prompt.fill("Generate a basic feedback form.");
	await prompt.press("Enter");
	await expect(dialog).toHaveCount(0);
	await expect(page.locator("output")).toHaveText(
		"Community meetup RSVP: Plan attendance for the next meetup. (1 fields)",
	);
	expect(requestCount).toBe(2);
});

test("generated template sections and submit text persist through the real builder", async ({
	page,
}) => {
	const structure: FormStructure = {
		pages: [
			{
				id: "generated_support_page",
				title: "Support request",
				sections: [
					{
						id: "generated_contact_section",
						title: "Contact details",
						description: "Where we can reply.",
						fields: [
							{
								id: "generated_email",
								uniqueIdentifier: "text-input",
								label: "Email address",
								inputType: "email",
								placeholder: "you@example.com",
								required: true,
								disabled: false,
							},
						],
					},
				],
			},
			{
				id: "generated_issue_page",
				title: "Issue details",
				sections: [
					{
						id: "generated_issue_section",
						title: "Describe the issue",
						fields: [
							{
								id: "generated_priority",
								uniqueIdentifier: "single-select",
								label: "Priority",
								required: true,
								disabled: false,
								options: [
									{ id: "priority_normal", label: "Normal", value: "normal" },
									{ id: "priority_urgent", label: "Urgent", value: "urgent" },
								],
							},
							{
								id: "generated_message",
								uniqueIdentifier: "text-area",
								label: "Message",
								placeholder: "Describe your issue.",
								maxLength: 1200,
								required: true,
								disabled: false,
							},
						],
					},
				],
			},
		],
	};
	const generatedForm = {
		title: "Support Ticket",
		description: "Tell us how we can help.",
		fields: structure,
		submitButtonText: "Send support request",
		meta: { responseTime: "1ms", responseTimeSeconds: "0.00s" },
	};
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			json: {
				session: {
					id: "generation-session",
					userId: "generation-user",
					expiresAt: "2099-01-01T00:00:00.000Z",
					token: "local-test",
				},
				user: {
					id: "generation-user",
					name: "Generation tester",
					email: "generation@example.com",
					emailVerified: true,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				},
			},
		}),
	);
	await page.route("**/api/generatewithai", (route) =>
		route.fulfill({ json: generatedForm }),
	);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = route.request().postDataJSON();
		return route.fulfill({
			json: { ...saved, id: "generated-support", status: "Active" },
		});
	});
	await page.route("**/api/forms/generated-support", (route) =>
		route.fulfill({
			json: { ...saved, id: "generated-support", status: "Active" },
		}),
	);
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page
		.getByRole("button", { name: "Generate with AI", exact: true })
		.click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("tab", { name: /Templates/ }).click();
	await dialog.getByRole("button", { name: /Support Ticket/ }).click();
	await dialog.getByRole("button", { name: "Generate", exact: true }).click();
	await expect(dialog).toHaveCount(0);

	const canvas = page.getByTestId("builder-canvas");
	await expect(
		page.getByRole("textbox", { name: "Form title", exact: true }),
	).toHaveValue(generatedForm.title);
	const sections = canvas.locator(".group\\/section");
	await expect(sections).toHaveCount(1);
	await expect(sections.nth(0)).toContainText("Contact details");
	await expect(
		canvas.getByRole("textbox", { name: "Email address" }),
	).toBeVisible();
	await page
		.getByRole("navigation", { name: "Form pages" })
		.getByRole("button", { name: "Issue details", exact: true })
		.click();
	await expect(sections).toHaveCount(1);
	await expect(sections.first()).toContainText("Describe the issue");
	await expect(
		canvas.getByRole("combobox", { name: "Priority" }),
	).toBeVisible();
	await expect(canvas.getByRole("textbox", { name: "Message" })).toBeVisible();
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expect(
		canvas.getByRole("heading", { name: generatedForm.title, exact: true }),
	).toBeVisible();
	await expect(
		canvas.getByRole("button", {
			name: generatedForm.submitButtonText,
			exact: true,
		}),
	).toBeVisible();
	await page.getByRole("button", { name: "Cancel", exact: true }).click();

	const saveResponse = page.waitForResponse(
		(response) =>
			response.url().endsWith("/api/forms/new") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "Save", exact: true }).click();
	expect((await saveResponse).ok()).toBe(true);
	expect(saved.title).toBe(generatedForm.title);
	expect(saved.description).toBe(generatedForm.description);
	expect(saved.fields).toEqual(structure);
	expect(saved.submitButtonText).toBe(generatedForm.submitButtonText);
});
