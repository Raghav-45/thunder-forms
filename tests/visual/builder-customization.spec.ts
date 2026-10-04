import { expect, type Locator, type Page, test } from "@playwright/test";
import communityThemes from "#/containers/dashboard/builder/[slug]/constants/community-themes.json" with { type: "json" };
import { THEME_COLOR_LABELS } from "#/containers/dashboard/builder/[slug]/constants/theme-color-labels";
import { BASIC_THEME_COLORS } from "#/containers/dashboard/builder/[slug]/constants/theme-customization";
import { createFormTheme, FORM_THEME_PRESETS, getFormThemeStyle, importFormThemeVariables } from "#/features/form-builder/theme";

async function mockSession(page: Page) {
	await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: {
		session: { id: "theme-session", userId: "theme-user", expiresAt: "2099-01-01T00:00:00.000Z", token: "local-test" },
		user: { id: "theme-user", name: "Theme tester", email: "theme@example.com", emailVerified: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
	} }));
}

async function expandCustomizationSections(page: Page, sections: string[]) {
	for (const section of sections) {
		const trigger = page.getByRole("button", { name: section, exact: true }).first();
		if ((await trigger.getAttribute("aria-expanded")) === "false") {
			await trigger.click();
		}
	}
}

test("Contact Us keeps its current appearance when Customize opens and unchanged settings apply", async ({ page }) => {
	test.setTimeout(45_000);
	await mockSession(page);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = route.request().postDataJSON();
		return route.fulfill({ json: { ...saved, id: "unchanged-contact", status: "Active" } });
	});
	await page.goto("/dashboard/builder/new-form?template=contact-us", { waitUntil: "networkidle" });
	await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10_000 });
	const section = page.locator(".group\\/section").first();
	await section.evaluate(async (element) => {
		element.getBoundingClientRect();
		await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
	});
	const appearance = (element: Element) => {
		const style = getComputedStyle(element);
		return Object.fromEntries(["background-color", "color", "border-radius", "padding", "font-family"].map((property) => [property, style.getPropertyValue(property)]));
	};
	const beforeSection = await section.evaluate(appearance);
	const beforeInput = await section.locator("input").first().evaluate(appearance);
	const geometry = (element: Element) => {
		const rect = element.getBoundingClientRect();
		return {
			height: Math.round(rect.height), width: Math.round(rect.width),
			fields: Array.from(element.querySelectorAll("input, textarea")).map((item) => {
				const field = item.getBoundingClientRect();
				return { top: Math.round(field.top - rect.top), left: Math.round(field.left - rect.left), height: Math.round(field.height), width: Math.round(field.width) };
			}),
		};
	};
	const beforeGeometry = await section.evaluate(geometry);
	await page.mouse.move(0, 0);
	await page.evaluate(() => document.fonts.ready);
	const beforeScreenshot = await section.screenshot({ animations: "disabled" });
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	const allStyles = (element: Element) => [element, ...element.querySelectorAll("*")].map((item) =>
		[null, "::before", "::after"].map((pseudo) => {
			const style = getComputedStyle(item, pseudo);
			return Object.fromEntries(Array.from(style).map((property) => [property, style.getPropertyValue(property)]));
		}),
	);
	const beforeStyles = await section.evaluate(allStyles);
	for (const selectedStyle of [undefined, "Thunder", "Bold Blocks"]) {
		await page.getByRole("button", { name: "Customize", exact: true }).click();
		await expect(editor.getByRole("combobox", { name: "Form style" })).toContainText("Thunder");
		if (selectedStyle) {
			await editor.getByRole("combobox", { name: "Form style" }).click();
			await page.getByRole("option", { name: selectedStyle, exact: true }).click();
			if (selectedStyle !== "Thunder") {
				await expect(preview).toHaveAttribute("data-form-theme", "true");
				await editor.getByRole("combobox", { name: "Form style" }).click();
				await page.getByRole("option", { name: "Thunder", exact: true }).click();
			}
		}
		await expect(preview).not.toHaveAttribute("data-form-theme");
		await expect(preview.getByRole("heading").first()).toHaveText("Contact Us");
		await expect(preview.getByRole("heading").first()).toHaveCSS("font-size", "24px");
		const respondentSection = preview.locator(".group\\/section").first();
		await expect(respondentSection.locator("p").first()).toHaveText("Section 1");
		await expect(respondentSection).toHaveCSS("padding", "16px");
		await expect(respondentSection.locator(".group\\/item")).toHaveCount(4);
		await editor.getByRole("button", { name: "Apply changes", exact: true }).first().click();
		await expect(page.getByText("Customization applied. Save your form to keep it.", { exact: true })).toBeVisible();
		await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10_000 });
		expect(await section.evaluate(appearance)).toEqual(beforeSection);
		expect(await section.locator("input").first().evaluate(appearance)).toEqual(beforeInput);
		await expect(page.locator("[data-form-theme]")).toHaveCount(0);
		expect(await section.evaluate(geometry)).toEqual(beforeGeometry);
		await page.mouse.move(0, 0);
		const afterScreenshot = await section.screenshot({ animations: "disabled" });
		expect(await section.evaluate(allStyles)).toEqual(beforeStyles);
		// Repainting a live theme can vary antialiased corners by two color levels.
		const maxChannelDifference = afterScreenshot.equals(beforeScreenshot) ? 0 : await page.evaluate(async (screenshots) => {
			const pixels = await Promise.all(screenshots.map(async (encoded) => {
				const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
				const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
				const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
				const context = canvas.getContext("2d")!;
				context.drawImage(bitmap, 0, 0);
				return context.getImageData(0, 0, bitmap.width, bitmap.height).data;
			}));
			if (pixels[0].length !== pixels[1].length) return Infinity;
			return pixels[0].reduce((maximum, channel, index) => Math.max(maximum, Math.abs(channel - pixels[1][index])), 0);
		}, [beforeScreenshot.toString("base64"), afterScreenshot.toString("base64")]);
		if (maxChannelDifference > 2) {
			await test.info().attach("before-default", { body: beforeScreenshot, contentType: "image/png" });
			await test.info().attach(`after-${selectedStyle ?? "unchanged"}`, { body: afterScreenshot, contentType: "image/png" });
		}
		expect(maxChannelDifference, `Applying ${selectedStyle ?? "unchanged settings"} preserves appearance`).toBeLessThanOrEqual(2);
	}
	const saveResponse = page.waitForResponse((response) => response.url().endsWith("/api/forms/new") && response.request().method() === "POST");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await saveResponse;
	expect(saved.fields).not.toHaveProperty("theme");
	expect(saved.fields).not.toHaveProperty("layout");
	expect(saved.submitButtonText).toBe("Send message");
});

test("Thunder restores default styling while keeping the form's layout and submit text", async ({ page }) => {
	await mockSession(page);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = { ...route.request().postDataJSON(), id: "default-thunder", status: "Active" };
		return route.fulfill({ json: saved });
	});
	await page.route("**/api/forms/default-thunder/viewForm", (route) => route.fulfill({ json: saved }));
	await page.goto("/dashboard/builder/new-form?template=contact-us", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expandCustomizationSections(page, ["Form width & position", "Sections & spacing", "Submit button"]);
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	const originalInput = await preview.locator("input").first().evaluate((element) => {
		const style = getComputedStyle(element);
		return { background: style.backgroundColor, radius: style.borderRadius, font: style.fontFamily };
	});
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await page.getByRole("option", { name: "Bold Blocks", exact: true }).click();
	await editor.getByRole("combobox", { name: "Heading alignment", exact: true }).click();
	await page.getByRole("option", { name: "Centered", exact: true }).click();
	await editor.getByRole("textbox", { name: "Submit button text", exact: true }).fill("Contact our team");
	await editor.getByRole("combobox", { name: "Button width", exact: true }).click();
	await page.getByRole("option", { name: "Full width", exact: true }).click();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(1);
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await page.getByRole("option", { name: "Thunder", exact: true }).click();
	await expect(preview).not.toHaveAttribute("data-form-theme");
	await expect(preview.locator("input").first()).toHaveCSS("background-color", originalInput.background);
	await expect(preview.locator("input").first()).toHaveCSS("border-radius", originalInput.radius);
	await expect(preview.locator("input").first()).toHaveCSS("font-family", originalInput.font);
	await expect(preview.getByRole("heading").first()).toHaveCSS("text-align", "center");
	await expect(preview.getByRole("button", { name: "Contact our team", exact: true })).toBeVisible();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);
	const saveResponse = page.waitForResponse((response) => response.url().endsWith("/api/forms/new") && response.request().method() === "POST");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await saveResponse;
	expect(saved.fields).not.toHaveProperty("theme");
	expect(saved.fields).toMatchObject({ layout: { headerAlignment: "center", submitWidth: "full" } });
	expect(saved.submitButtonText).toBe("Contact our team");
	await page.goto("/forms/default-thunder", { waitUntil: "networkidle" });
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);
	await expect(page.getByRole("textbox", { name: "Full name", exact: false })).toHaveCSS("background-color", originalInput.background);
	await expect(page.locator("main h1")).toHaveCSS("text-align", "center");
	const button = page.getByRole("button", { name: "Contact our team", exact: true });
	await expect.poll(() => button.evaluate((element) => Math.abs(element.getBoundingClientRect().width - element.parentElement!.getBoundingClientRect().width) < 1)).toBe(true);
});

test("a customized Contact Us form loads its current appearance into Customize without changing the canvas", async ({ page }) => {
	await page.goto("/dashboard/builder/new-form?template=contact-us", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByRole("button", { name: "Import or export a theme", exact: true }).click();
	await editor.getByRole("textbox", { name: "Theme code", exact: true }).fill(":root { --background: #102030; --card: #283848; --radius: 0.5rem; --spacing: 0.3rem; --font-sans: Georgia, serif; }");
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	const section = page.locator(".group\\/section").first();
	await section.evaluate(async (element) => {
		element.getBoundingClientRect();
		await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
	});
	const appearance = (element: Element) => {
		const style = (item: Element) => Object.fromEntries(["padding", "border-radius", "background-color", "font-family"].map((property) => [property, getComputedStyle(item).getPropertyValue(property)]));
		const rect = element.getBoundingClientRect();
		return {
			section: style(element), input: style(element.querySelector("input")!),
			positions: Array.from(element.querySelectorAll("input, textarea")).map((item) => Math.round(item.getBoundingClientRect().top - rect.top)),
			height: Math.round(rect.height), width: Math.round(rect.width),
		};
	};
	const before = await section.evaluate(appearance);
	await page.mouse.move(0, 0);
	await page.evaluate(() => document.fonts.ready);
	const beforeScreenshot = await section.screenshot({ animations: "disabled" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expect(preview.getByRole("heading").first()).toHaveText("Contact Us");
	await expect(preview.getByRole("heading").first()).toHaveCSS("font-family", before.section["font-family"]);
	await expect(preview.locator(".group\\/section").first()).toHaveCSS("background-color", "rgb(40, 56, 72)");
	await expect(preview.locator(".group\\/section > div:first-child p").first()).toHaveText("Section 1");
	await expect(preview.locator(".group\\/section .group\\/item")).toHaveCount(4);
	expect(await section.evaluate(appearance)).toEqual(before);
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	expect(await section.evaluate(appearance)).toEqual(before);
	await page.mouse.move(0, 0);
	expect((await section.screenshot({ animations: "disabled" })).equals(beforeScreenshot)).toBe(true);
});

test("ThunderForms presets transform complete styles, cancel cleanly and persist on the public form", async ({ page }) => {
	await mockSession(page);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = { ...route.request().postDataJSON(), id: "thunder-preset-test", status: "Active" };
		return route.fulfill({ json: saved });
	});
	await page.route("**/api/forms/thunder-preset-test", (route) => route.fulfill({ json: saved }));
	await page.route("**/api/forms/thunder-preset-test/viewForm", (route) => route.fulfill({ json: saved }));
	await page.goto("/dashboard/builder/new-form?template=contact-us", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await expect(page.locator('[data-slot="command-group"]').first()).toContainText("ThunderForms");
	await page.getByRole("combobox", { name: "Search themes or creators" }).fill("square");
	await expect(page.getByRole("option", { name: "Green Terminal", exact: true })).toBeVisible();
	await page.getByRole("option", { name: "Green Terminal", exact: true }).click();
	for (const preset of FORM_THEME_PRESETS.filter((preset) => preset.palette)) {
		await editor.getByRole("combobox", { name: "Form style" }).click();
		await page.getByRole("combobox", { name: "Search themes or creators" }).fill(preset.label);
		const option = page.getByRole("option", { name: preset.label, exact: true });
		await expect(option).toContainText(preset.description);
		await option.click();
		const theme = createFormTheme(preset.id);
		await expect(preview).toHaveCSS("--background", theme.colors.background);
		await expect(preview).toHaveCSS("--card", theme.colors.card);
		await expect(preview).toHaveCSS("--font-sans", theme.fonts!.sans);
		await expect(preview).toHaveCSS("--spacing", `${theme.spacing}rem`);
		await expect(preview.locator(".group\\/section").first()).toHaveCSS("border-radius", `${theme.radius * 16}px`);
	}
	await editor.getByRole("button", { name: "Cancel", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await page.getByRole("combobox", { name: "Search themes or creators" }).fill("Bold Blocks");
	await page.getByRole("option", { name: "Bold Blocks", exact: true }).click();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	const saveResponse = page.waitForResponse((response) => response.url().endsWith("/api/forms/new") && response.request().method() === "POST");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await saveResponse;
	expect(saved.fields).toMatchObject({ theme: createFormTheme("bold-blocks") });
	await page.goto("/forms/thunder-preset-test", { waitUntil: "networkidle" });
	const form = page.locator("[data-form-theme]");
	await expect(form).toHaveCSS("background-color", "rgb(255, 223, 100)");
	await expect(form.locator("section").first()).toHaveCSS("border-radius", "0px");
	await expect(form.locator("section").first()).toHaveCSS("box-shadow", "rgb(33, 27, 12) 6px 6px 0px 0px");
	await expect(form.getByRole("button", { name: "Send message", exact: true })).toHaveCSS("background-color", "rgb(33, 27, 12)");
});

test("theme import and copy buttons stay in one horizontal row", async ({ page }) => {
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByRole("button", { name: "Import or export a theme", exact: true }).click();
	for (const width of [1440, 1280, 1024]) {
		await page.setViewportSize({ width, height: 1000 });
		const buttons = editor.getByRole("button", { name: /^(Import theme|Copy theme code)$/ });
		await expect(buttons).toHaveCount(2);
		const boxes = await buttons.evaluateAll((elements) => elements.map((element) => {
			const rect = element.getBoundingClientRect();
			return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
		}));
		expect(boxes[0].y).toBeCloseTo(boxes[1].y);
		expect(boxes[0].height).toBeCloseTo(boxes[1].height);
		expect(boxes[1].x).toBeGreaterThanOrEqual(boxes[0].x + boxes[0].width);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	}
});

test("customizations preview live, cancel cleanly, apply and reset", async ({ page }) => {
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	const originalBackground = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
	await page.getByRole("button", { name: "text-input", exact: true }).click();
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await expect(preview.getByText("Your Name", { exact: true })).toBeVisible();
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await page.getByRole("option", { name: "Ocean", exact: true }).click();
	await expect(editor.getByRole("tab", { name: "Light", exact: true })).toHaveCount(0);
	await expect(editor.getByRole("tab", { name: "Dark", exact: true })).toHaveCount(0);
	await expect(preview).toHaveAttribute("data-form-theme", "true");
	await expect(preview.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(96, 165, 250)");
	await editor.getByRole("button", { name: "Cancel", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);

	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expandCustomizationSections(page, ["Text", "Form width & position", "Sections & spacing", "Submit button"]);
	await expect(preview).not.toHaveAttribute("data-form-theme");
	await editor.getByRole("combobox", { name: "Text font", exact: true }).click();
	await page.getByRole("option", { name: "Georgia", exact: true }).click();
	await expect(preview).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
	const tracking = editor.getByRole("slider", { name: "Letter spacing", exact: true });
	await tracking.focus();
	await tracking.press("ArrowRight");
	await expect(tracking).toHaveAttribute("aria-valuenow", "0.005");
	const radius = editor.getByRole("slider", { name: "Corner rounding", exact: true });
	await radius.focus();
	await radius.press("Home");
	await expect(preview.locator(".group\\/section").first()).toHaveCSS("border-radius", "0px");
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.locator("[data-form-theme]")).toHaveCSS(
		"font-family",
		'Georgia, "Times New Roman", serif',
	);
	await expect(
		page
			.getByRole("navigation", { name: "Form pages" })
			.locator("[data-active-page-tab-surface]"),
	).toHaveCSS(
		"background-color",
		originalBackground,
	);

	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expect(editor.getByRole("combobox", { name: "Text font", exact: true })).toContainText("Georgia");
	await editor.getByRole("button", { name: "Reset to original", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);
});

test("theme persists in the save payload and public form after reload, including portaled options", async ({ page }) => {
	let saved: Record<string, unknown> = {};
	await mockSession(page);
	await page.route("**/api/forms/new", async (route) => {
		saved = { ...route.request().postDataJSON(), id: "theme-test", status: "Active" };
		await route.fulfill({ json: saved });
	});
	await page.route("**/api/forms/theme-test", (route) => route.fulfill({ json: saved }));
	await page.route("**/api/forms/theme-test/viewForm", (route) => route.fulfill({ json: saved }));
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "text-input", exact: true }).click();
	await page.getByRole("button", { name: "single-select", exact: true }).click();
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expandCustomizationSections(page, ["Form width & position", "Sections & spacing", "Submit button"]);
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await editor.getByRole("combobox", { name: "Heading alignment", exact: true }).click();
	await page.getByRole("option", { name: "Centered", exact: true }).click();
	await editor.getByRole("combobox", { name: "Form width", exact: true }).click();
	await page.getByRole("option", { name: "Wide", exact: true }).click();
	await editor
		.getByRole("combobox", { name: "Form position", exact: true })
		.click();
	await page.getByRole("option", { name: "Left aligned", exact: true }).click();
	await editor
		.getByRole("combobox", { name: "Space inside sections", exact: true })
		.click();
	await page.getByRole("option", { name: "Spacious", exact: true }).click();
	const fieldSpacing = editor.getByRole("slider", {
		name: "Between fields",
		exact: true,
	});
	await fieldSpacing.focus();
	await fieldSpacing.press("ArrowRight");
	await expect(fieldSpacing).toHaveAttribute("aria-valuenow", "5.25");
	await editor.getByRole("combobox", { name: "Button position", exact: true }).click();
	await page.getByRole("option", { name: "Right aligned", exact: true }).click();
	await expect(preview.getByRole("heading").first()).toHaveCSS("text-align", "center");
	await editor.getByRole("combobox", { name: "Form style" }).click();
	await page.getByRole("option", { name: "Ocean", exact: true }).click();
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByText("Import or export a theme", { exact: true }).click();
	await editor.getByRole("textbox", { name: "Theme code", exact: true }).fill(":root { --popover: #ffeedd; --popover-foreground: #112233; } .dark { --primary: #334455; }");
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect.poll(() => saved.id).toBe("theme-test");
	expect(saved.fields).toMatchObject({
	layout: {
		contentAlignment: "left",
		headerAlignment: "center",
		contentWidth: "wide",
		sectionSpacing: "spacious",
		spacing: { fieldGap: 5.25 },
		submitAlignment: "right",
	},
	theme: { colors: { primary: "#334455", popover: "#ffeedd" } },
});
	const savedTheme = (saved.fields as { theme: object }).theme;
	expect(savedTheme).not.toHaveProperty("mode");
	expect(savedTheme).not.toHaveProperty("light");
	expect(savedTheme).not.toHaveProperty("dark");
	await page.goto("/forms/theme-test", { waitUntil: "networkidle" });
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(51, 68, 85)");
	await expect(page.locator("main h1")).toHaveCSS("text-align", "center");
	await expect(page.locator("main")).toHaveCSS("max-width", "1280px");
	await expect(page.getByRole("button", { name: "Submit", exact: true }).locator("..")).toHaveCSS("justify-content", "flex-end");
	await page.getByRole("combobox").click();
	await expect(page.getByRole("listbox")).toHaveCSS("background-color", "rgb(255, 238, 221)");
	await expect(page.getByRole("listbox")).toHaveCSS("color", "rgb(17, 34, 51)");
	await page.keyboard.press("Escape");
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(51, 68, 85)");
	await expect(page.locator("[data-form-theme]")).toHaveAttribute("data-form-theme", "true");
});

for (const viewport of [
	{ name: "desktop", width: 1440, height: 1000 },
	{ name: "mobile", width: 390, height: 844 },
]) {
	test(`submit button text and width match preview and public form on ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await mockSession(page);
		let saved: Record<string, unknown> = {};
		await page.route("**/api/forms/new", (route) => {
			saved = { ...route.request().postDataJSON(), id: "submit-button-test", status: "Active" };
			return route.fulfill({ json: saved });
		});
		await page.route("**/api/forms/submit-button-test", (route) => route.fulfill({ json: saved }));
		await page.route("**/api/forms/submit-button-test/viewForm", (route) => route.fulfill({ json: saved }));
		const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
		const preview = page.getByTestId("builder-canvas");
		const expectWidth = async (button: Locator, full: boolean) => {
			await expect.poll(() => button.evaluate((element) => {
				const parent = element.parentElement!;
				return Math.abs(element.getBoundingClientRect().width - parent.getBoundingClientRect().width) < 1;
			})).toBe(full);
		};
		for (const mode of [
			{ value: "responsive", label: "Full width on phones" },
			{ value: "auto", label: "Auto width" },
			{ value: "full", label: "Full width" },
		]) {
			await page.setViewportSize({ width: 1440, height: 1000 });
			await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
			await page.getByRole("button", { name: "text-input", exact: true }).click();
			if (mode.value === "responsive") {
				await page.getByRole("button", { name: "Advanced Settings", exact: true }).click();
				const settings = page.getByRole("dialog", { name: "Settings", exact: true });
				await expect(settings.getByRole("button", { name: "Appearance", exact: true })).toHaveCount(0);
				await expect(settings.getByRole("textbox", { name: /submit button text/i })).toHaveCount(0);
				await page.keyboard.press("Escape");
			}
			await page.getByRole("button", { name: "Customize", exact: true }).click();
			const heading = editor.getByRole("region", { name: "Form heading", exact: true });
			const sections = editor.getByRole("region", { name: "Sections & spacing", exact: true });
			const submit = editor.getByRole("region", { name: "Submit button", exact: true });
			await editor.getByRole("button", { name: "Sections & spacing", exact: true }).click();
			await editor.getByRole("button", { name: "Submit button", exact: true }).click();
			await expect(heading.getByRole("combobox", { name: "Heading alignment", exact: true })).toBeVisible();
			await expect(heading.getByRole("slider", { name: "Space between title & description", exact: true })).toBeVisible();
			await expect(sections.getByRole("combobox", { name: "Space inside sections", exact: true })).toBeVisible();
			await expect(sections.getByRole("slider", { name: "Between fields", exact: true })).toBeVisible();
			await expect(sections.getByRole("slider", { name: "Between sections", exact: true })).toBeVisible();
			await expect(submit.getByRole("slider", { name: "Last section & submit button", exact: true })).toBeVisible();
			if (mode.value === "responsive") {
				await submit.getByRole("textbox", { name: "Submit button text", exact: true }).fill("Cancel this draft");
				await submit.getByRole("combobox", { name: "Button width", exact: true }).click();
				await page.getByRole("option", { name: "Auto width", exact: true }).click();
				await editor.getByRole("button", { name: "Cancel", exact: true }).click();
				await page.getByRole("button", { name: "Customize", exact: true }).click();
				await editor.getByRole("button", { name: "Submit button", exact: true }).click();
				await expect(submit.getByRole("textbox", { name: "Submit button text", exact: true })).toHaveValue("");
				await expect(submit.getByRole("combobox", { name: "Button width", exact: true })).toContainText("Full width on phones");
			}
			await submit.getByRole("textbox", { name: "Submit button text", exact: true }).fill(" Send response ");
			await submit.getByRole("combobox", { name: "Button width", exact: true }).click();
			await page.getByRole("option", { name: mode.label, exact: true }).click();
			const position = submit.getByRole("combobox", { name: "Button position", exact: true });
			if (mode.value === "full") {
				await expect(position).toBeDisabled();
			} else {
				await position.click();
				await page.getByRole("option", { name: "Right aligned", exact: true }).click();
			}
			if (viewport.name === "mobile") {
				await page.setViewportSize(viewport);
			}
			const fullWidth = mode.value === "full" || (mode.value === "responsive" && viewport.name === "mobile");
			const previewButton = preview.getByRole("button", { name: "Send response", exact: true });
			await expectWidth(previewButton, fullWidth);
			if (!fullWidth) await expect(previewButton.locator("..")).toHaveCSS("justify-content", "flex-end");
			await page.setViewportSize({ width: 1440, height: 1000 });
			await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
			await page.getByRole("button", { name: "Customize", exact: true }).click();
			await editor.getByRole("button", { name: "Submit button", exact: true }).click();
			await expect(submit.getByRole("textbox", { name: "Submit button text", exact: true })).toHaveValue("Send response");
			await expect(submit.getByRole("combobox", { name: "Button width", exact: true })).toContainText(mode.label);
			if (mode.value === "full") {
				await editor.getByRole("button", { name: "Reset to original", exact: true }).click();
				await expect(submit.getByRole("textbox", { name: "Submit button text", exact: true })).toHaveValue("");
				await expect(submit.getByRole("combobox", { name: "Button width", exact: true })).toContainText("Full width on phones");
				await submit.getByRole("textbox", { name: "Submit button text", exact: true }).fill("Send response");
				await submit.getByRole("combobox", { name: "Button width", exact: true }).click();
				await page.getByRole("option", { name: "Full width", exact: true }).click();
				await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
			} else {
				await editor.getByRole("button", { name: "Cancel", exact: true }).click();
			}
			const saveResponse = page.waitForResponse((response) =>
				response.url().endsWith("/api/forms/new") && response.request().method() === "POST",
			);
			await page.getByRole("button", { name: "Save", exact: true }).click();
			await saveResponse;
			await expect.poll(() => saved.submitButtonText).toBe("Send response");
			expect(saved.fields).toMatchObject({ layout: { submitWidth: mode.value } });
			await page.setViewportSize(viewport);
			await page.goto("/forms/submit-button-test", { waitUntil: "networkidle" });
			const publicButton = page.getByRole("button", { name: "Send response", exact: true });
			await expectWidth(publicButton, fullWidth);
			if (!fullWidth) await expect(publicButton.locator("..")).toHaveCSS("justify-content", "flex-end");
			await page.reload({ waitUntil: "networkidle" });
			await expectWidth(publicButton, fullWidth);
		}
	});
}

test("customization keeps the builder's responsive sidebar layout and dark chrome", async ({ page }, testInfo) => {
 await page.addInitScript(() => localStorage.setItem("theme", "light"));
 await page.emulateMedia({ colorScheme: "light" });
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
 await expect(page.locator("html")).toHaveClass("dark");
 await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
 const canvas = page.getByTestId("builder-canvas");
 const before = await canvas.boundingBox();
 await page.getByRole("button", { name: "Customize", exact: true }).click();
 await expect(page.getByRole("dialog")).toHaveCount(0);
 expect(await canvas.boundingBox()).toEqual(before);
 await expect(page.getByTestId("builder-left-sidebar")).toBeHidden();
 await expect(page.getByTestId("builder-right-sidebar")).toBeHidden();
 await page.setViewportSize({ width: 1440, height: 1000 });
 await expect(page.getByRole("heading", { name: "Appearance", exact: true })).toBeVisible();
 await expect(page.getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
 await testInfo.attach("customization-sidebars", { body: await page.screenshot(), contentType: "image/png" });
 await page.getByRole("button", { name: "Customize", exact: true }).click();
 await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("a legacy saved form retains its customization and saves a single palette", async ({ page }) => {
	await mockSession(page);
	const { colors, ...settings } = createFormTheme();
	let persisted = {
		id: "legacy-theme",
		title: "Legacy customization",
		fields: {
			pages: [{ id: "page-1", sections: [{ id: "section-1", fields: [{ id: "name", uniqueIdentifier: "text-input", label: "Your name" }] }] }],
			theme: { ...settings, fontFamily: "georgia", mode: "dark", light: { ...colors, primary: "#123456" }, dark: { ...colors, primary: "#ff0000" } },
		},
	};
	let saved: Record<string, unknown> | undefined;
	await page.route("**/api/forms/legacy-theme", (route) => route.fulfill({ json: persisted }));
	await page.route("**/api/forms/legacy-theme/update", (route) => {
		saved = route.request().postDataJSON();
		persisted = { ...persisted, ...saved };
		return route.fulfill({ json: persisted });
	});
	await page.route("**/api/forms/legacy-theme/viewForm", (route) => route.fulfill({ json: { ...persisted, status: "Active" } }));
	// Mount the real builder with a memory router: browser session mocks cannot
	// intercept the dashboard's server-side login guard.
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.evaluate(async () => {
		const load = (path: string) => import(/* @vite-ignore */ path);
		const componentPath = "/src/containers/dashboard/builder/[slug]/index.tsx";
		const source = await fetch(componentPath).then((response) => response.text());
		const reactPath = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
		const queryPath = source.match(/from "([^"]*react-query[^"]*)"/)?.[1];
		const routerPath = source.match(/from "([^"]*react-router[^"]*)"/)?.[1];
		if (!reactPath || !queryPath || !routerPath) throw new Error("Missing client dependencies");
		const [React, client, query, routerModule, builder] = await Promise.all([
			load(reactPath),
			load("/node_modules/.vite/deps/react-dom_client.js"),
			load(queryPath),
			load(routerPath),
			load(componentPath),
		]);
		const e = React.default.createElement;
		const queryClient = new query.QueryClient();
		const root = routerModule.createRootRoute({
			component: () => e(query.QueryClientProvider, { client: queryClient }, e(routerModule.Outlet)),
		});
		const route = routerModule.createRoute({
			getParentRoute: () => root,
			path: "/dashboard/builder/legacy-theme",
			component: () => e(builder.default, { slug: "legacy-theme" }),
		});
		const router = routerModule.createRouter({
			routeTree: root.addChildren([route]),
			history: routerModule.createMemoryHistory({ initialEntries: ["/dashboard/builder/legacy-theme"] }),
		});
		const host = document.createElement("div");
		document.body.replaceChildren(host);
		client.default.createRoot(host).render(e(routerModule.RouterProvider, { router }));
	});
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const preview = page.getByTestId("builder-canvas");
	await expect(preview.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(255, 0, 0)");
	await expect(preview).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
	await page.getByRole("button", { name: "Apply changes", exact: true }).click();
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect.poll(() => saved).toBeDefined();
	const theme = (saved?.fields as { theme: object }).theme;
	expect(theme).toMatchObject({ colors: { primary: "#ff0000" }, fontFamily: "georgia" });
	expect(theme).not.toHaveProperty("mode");
	expect(theme).not.toHaveProperty("light");
	expect(theme).not.toHaveProperty("dark");
	await page.goto("/forms/legacy-theme", { waitUntil: "networkidle" });
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("community presets are searchable, editable and persist with fonts and complete tokens", async ({ page }, testInfo) => {
	const preset = communityThemes.find((theme) => theme.name === "Sage Green")!;
	let saved: Record<string, unknown> = {};
	await mockSession(page);
	await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
	await page.route("**/api/forms/new", (route) => {
		saved = { ...route.request().postDataJSON(), id: "community-theme", status: "Active" };
		return route.fulfill({ json: saved });
	});
	await page.route("**/api/forms/community-theme/viewForm", (route) => route.fulfill({ json: saved }));
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "text-input", exact: true }).click();
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await editor.getByRole("combobox", { name: "Form style" }).click();
	const themeList = page.locator('[data-slot="command-list"]');
	const themeListSize = await themeList.evaluate((element) => ({
		clientHeight: element.clientHeight,
		scrollHeight: element.scrollHeight,
	}));
	expect(themeListSize.scrollHeight).toBeGreaterThan(themeListSize.clientHeight);
	await themeList.hover();
	await page.mouse.wheel(0, 240);
	await expect
		.poll(() => themeList.evaluate((element) => element.scrollTop))
		.toBeGreaterThan(0);
	await page.getByRole("combobox", { name: "Search themes or creators" }).fill(preset.author);
	await expect(page.getByRole("option", { name: preset.name, exact: true })).toBeVisible();
	await testInfo.attach("community-picker", { body: await page.screenshot(), contentType: "image/png" });
	await page.getByRole("option", { name: preset.name, exact: true }).click();
	await expect(editor.getByRole("link", { name: `View ${preset.name} by ${preset.author} on tweakcn` })).toHaveAttribute("href", preset.url);
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	await expect(preview).toHaveCSS("--chart-5", preset.variables["chart-5"]);
	await expect(preview).toHaveCSS("--sidebar-ring", preset.variables["sidebar-ring"]);
	await expect(preview).toHaveCSS("--shadow-xl", preset.variables["shadow-xl"]);
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByRole("button", { name: "All colors", exact: true }).click();
	await editor.getByRole("switch", { name: "Show color codes", exact: true }).check();
	await expect(editor.getByRole("textbox", { name: "Chart 5 code", exact: true })).toHaveValue(preset.variables["chart-5"]);
	await expect(editor.getByText(/calc\(/)).toHaveCount(0);
	await editor.getByRole("button", { name: "More shadow controls", exact: true }).click();
	await expect(editor.getByText("Shape shadows without needing CSS.")).toBeVisible();
	await testInfo.attach("community-preview", { body: await page.screenshot(), contentType: "image/png" });
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect.poll(() => saved.id).toBe("community-theme");
	expect(saved.fields).toMatchObject({ theme: { fonts: { sans: "Plus Jakarta Sans, sans-serif", serif: "Lora, serif", mono: "IBM Plex Mono, monospace" }, spacing: 0.27, letterSpacing: -0.025, colors: { "sidebar-ring": preset.variables["sidebar-ring"] }, shadows: { "shadow-xl": preset.variables["shadow-xl"] } } });
	await page.goto("/forms/community-theme", { waitUntil: "networkidle" });
	await page.reload({ waitUntil: "networkidle" });
	const form = page.locator("[data-form-theme]");
	await expect(form).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	await expect(form).toHaveCSS("--shadow-xl", preset.variables["shadow-xl"]);
	await expect(page.locator('link[data-form-fonts][href*="Plus%20Jakarta%20Sans"]')).toHaveCount(1);
	await expect(page.locator('link[data-form-fonts][href*="Lora"]')).toHaveCount(1);
});

test("theme links and CSS or registry files import dark colors and all customization settings", async ({ page }) => {
	const preset = communityThemes.find((theme) => theme.name === "Sage Green")!;
	await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
	await page.route(`https://tweakcn.com/r/themes/${preset.id}`, (route) => route.fulfill({ json: { cssVars: { theme: { "font-sans": "Arial, sans-serif" }, light: { primary: "#ffffff" }, dark: preset.variables } } }));
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
	const preview = page.getByTestId("builder-canvas");
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByText("Import or export a theme", { exact: true }).click();
	const link = editor.getByRole("textbox", { name: "Theme link from tweakcn" });
	await link.fill("https://example.com/theme");
	await editor.getByRole("button", { name: "Import from link", exact: true }).click();
	await expect(editor.getByRole("alert")).toContainText("tweakcn.com");
	await expect(preview).toHaveCSS("--primary", await page.locator("body").evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()));
	await link.fill(`https://tweakcn.com/editor/theme?theme=${preset.id}`);
	await editor.getByRole("button", { name: "Import from link", exact: true }).click();
	await expect(preview).toHaveCSS("--primary", preset.variables.primary);
	await expect(preview).toHaveCSS("--spacing", "0.27rem");
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	const css = editor.getByRole("textbox", { name: "Theme code", exact: true });
	await css.fill(':root { --font-sans: url(https://example.com/font); }');
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await expect(editor.getByRole("alert")).toContainText("Invalid font stack");
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	const file = editor.getByLabel("Theme file (CSS or JSON)", { exact: true });
	await file.setInputFiles({ name: "theme.css", mimeType: "text/css", buffer: Buffer.from(':root { --primary: #112233; --radius: 8px; --spacing: 0.3rem; --font-sans: Arial, sans-serif; --shadow-color: 0, 0%, 0%; --shadow-xl: 0 4px 8px hsl(0, 0%, 0% / 0.5); } .dark { --primary: #abcdef; }') });
	await expect(preview).toHaveCSS("--primary", "#abcdef");
	await expect(preview).toHaveCSS("--radius", "0.5rem");
	await expect(preview).toHaveCSS("--spacing", "0.3rem");
	await expect(preview).toHaveCSS("--shadow-xl", "0 4px 8px hsl(0 0% 0% / 0.5)");
	await file.setInputFiles({ name: "theme.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ cssVars: { dark: preset.variables } })) });
	await expect(preview).toHaveCSS("--primary", preset.variables.primary);
	await editor.getByRole("button", { name: "Copy theme code", exact: true }).click();
	await expect(css).toHaveValue(/--font-serif: Lora, serif;/);
	await expect(css).toHaveValue(/--shadow-xl:/);
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await expect(preview).toHaveCSS("--shadow-xl", preset.variables["shadow-xl"]);
	await expect(preview).toHaveCSS("--tracking-normal", "-0.025em");
});

test("every bundled community theme produces browser-valid color, font and shadow properties", async ({ page }) => {
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	const failures = await page.evaluate(async (presets) => {
		const load = (path: string) => import(/* @vite-ignore */ path);
		const { importFormThemeVariables, createFormTheme, getFormThemeStyle } = await load("/src/features/form-builder/theme.ts");
		return presets.flatMap((preset) => {
			const style = getFormThemeStyle(importFormThemeVariables(preset.variables, createFormTheme()));
			return Object.entries(style).flatMap(([key, value]) => {
				const property = /^--shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl))?$/.test(key) ? "box-shadow" : key.startsWith("--font-") ? "font-family" : key.startsWith("--") && /^(?:oklch|oklab|hsl|rgb|#|color-mix)/.test(String(value)) ? "color" : undefined;
				return property && !CSS.supports(property, String(value)) ? [`${preset.name}: ${key}=${value}`] : [];
			});
		});
	}, communityThemes);
	expect(failures).toEqual([]);
});

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "compact desktop", width: 1024, height: 844 }]) {
	test(`basic controls and advanced accordions preserve every setting on ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
		const preset = communityThemes.find((theme) => theme.name === "Sage Green")!;
		await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
		await page.getByRole("button", { name: "Customize", exact: true }).click();
		const editor = page.locator("[data-testid=builder-left-sidebar], [data-testid=builder-right-sidebar]");
		const basic = editor.getByRole("region", { name: "Make it yours", exact: true });
		const full = editor.getByRole("region", { name: "Advanced customizations", exact: true });
		for (const section of ["Colors & surfaces", "Text", "Depth & polish"]) {
			await basic.getByRole("button", { name: section, exact: true }).click();
		}
		for (const section of ["Form width & position", "Sections & spacing", "Submit button"]) {
			await editor.getByRole("button", { name: section, exact: true }).click();
		}
		const preview = page.getByTestId("builder-canvas");
		const advanced = editor.getByRole("button", { name: "Advanced customizations", exact: true });
		await expect(advanced).toHaveAttribute("aria-expanded", "false");
		await expect(basic.locator('input[type="color"]')).toHaveCount(10);
		for (const token of BASIC_THEME_COLORS) {
			await expect(basic.getByLabel(`Choose ${THEME_COLOR_LABELS[token].toLowerCase()}`, { exact: true })).toBeVisible();
		}
		await expect(basic.getByRole("slider")).toHaveCount(3);
		await expect(basic.getByRole("combobox", { name: "Text font", exact: true })).toBeVisible();
		await expect(editor.getByRole("textbox", { name: "Search colors", exact: true })).toHaveCount(0);
		await expect(editor.getByRole("button", { name: "Import or export a theme", exact: true })).toBeHidden();
		await editor.getByRole("combobox", { name: "Form style" }).click();
		await page.getByRole("combobox", { name: "Search themes or creators" }).fill(preset.name);
		await page.getByRole("option", { name: preset.name, exact: true }).click();
		const expected = importFormThemeVariables(preset.variables, createFormTheme());
		let expectedVariables = Object.fromEntries(Object.entries(getFormThemeStyle(expected)!).filter(([name]) => name.startsWith("--")));
		const previewVariables = () => preview.evaluate(el => Object.fromEntries(Array.from(el.style).filter(name => name.startsWith("--")).map(name => [name, el.style.getPropertyValue(name)])));
		expect(await previewVariables()).toEqual(expectedVariables);
		await basic.getByLabel("Choose button color", { exact: true }).fill("#334455");
		expected.colors.primary = "#334455";
		const radius = editor.getByRole("slider", { name: "Corner rounding", exact: true });
		await radius.focus();
		await radius.press("Home");
		expected.radius = 0;
		await expect(editor.getByText("Square", { exact: true })).toBeVisible();
		const spacing = editor.getByRole("slider", {
			name: "Between fields",
			exact: true,
		});
		await spacing.focus();
		await spacing.press("ArrowRight");
		await expect(spacing).toHaveAttribute("aria-valuenow", "5.25");
		const tracking = basic.getByRole("slider", { name: "Letter spacing", exact: true });
		await tracking.focus();
		await tracking.press("ArrowRight");
		expected.letterSpacing = -0.02;
		expectedVariables = Object.fromEntries(Object.entries(getFormThemeStyle(expected)!).filter(([name]) => name.startsWith("--")));
		expect(await previewVariables()).toEqual(expectedVariables);

		// Keyboard activation expands advanced settings without replacing the basics.
		await advanced.focus();
		await advanced.press("Enter");
		await expect(advanced).toHaveAttribute("aria-expanded", "true");
		await expect(editor.getByRole("button", { name: "Make it yours", exact: true })).toHaveAttribute("aria-expanded", "true");
		await expect(basic.getByRole("combobox", { name: "Text font", exact: true })).toBeVisible();
		await expect(full.getByRole("textbox", { name: "Search colors", exact: true })).toHaveCount(0);
		const colors = full.getByRole("button", { name: "All colors", exact: true });
		await colors.click();
		await expect(full.locator('input[type="color"]:visible')).toHaveCount(32);
		await full.getByRole("switch", { name: "Show color codes", exact: true }).check();
		for (const [token, label] of Object.entries(THEME_COLOR_LABELS)) {
			await expect(full.getByRole("textbox", { name: `${label} code`, exact: true })).toHaveValue(expected.colors[token as keyof typeof expected.colors]!);
		}
	await colors.click();
	await expect(full.getByText(/calc\(/)).toHaveCount(0);
	await full.getByRole("button", { name: "More shadow controls", exact: true }).click();
	await expect(full.getByRole("slider")).toHaveCount(3);
	await expect(full.getByText("Shape shadows without needing CSS.")).toBeVisible();
		const strength = basic.getByRole("slider", { name: "Shadow strength", exact: true });
		await strength.focus();
		await strength.press("End");
		expected.shadow.opacity = 1;
		expected.shadows = undefined;
	expectedVariables = Object.fromEntries(Object.entries(getFormThemeStyle(expected)!).filter(([name]) => name.startsWith("--")));
	await expect(basic.getByRole("slider", { name: "Shadow strength", exact: true })).toHaveAttribute("aria-valuenow", "1");
	expect(await previewVariables()).toEqual(expectedVariables);
	await advanced.click();
		await expect(advanced).toHaveAttribute("aria-expanded", "false");
		await expect(editor.getByRole("button", { name: "More shadow controls", exact: true })).toBeHidden();
	await expect(basic.locator('input[type="color"]')).toHaveCount(10);
	expect(await previewVariables()).toEqual(expectedVariables);
	await advanced.click();
	expect(await previewVariables()).toEqual(expectedVariables);
		await editor.getByRole("button", { name: "Make it yours", exact: true }).click();
	await expect(basic).toBeHidden();
	await expect(advanced).toHaveAttribute("aria-expanded", "true");
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
		const canvasVariables = await page.locator("[data-form-theme]").evaluate(el => Object.fromEntries(Array.from(el.style).filter(name => name.startsWith("--")).map(name => [name, el.style.getPropertyValue(name)])));
		expect(canvasVariables).toEqual(expectedVariables);
		await page.getByRole("button", { name: "Customize", exact: true }).click();
		await expect(editor.getByRole("button", { name: "Advanced customizations", exact: true })).toHaveAttribute("aria-expanded", "false");
		await expect(editor.getByRole("button", { name: "Make it yours", exact: true })).toHaveAttribute("aria-expanded", "true");
		expect(await previewVariables()).toEqual(expectedVariables);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	});
}

for (const width of [1024, 1440]) {
	test(`mode switches preserve canvas nodes, page, scroll and geometry at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 800 });
		await page.goto("/dashboard/builder/new-form?template=contact-us", {
			waitUntil: "networkidle",
		});
		const tabs = page.getByRole("navigation", { name: "Form pages" });
		await tabs.getByRole("button", { name: "Add page", exact: true }).click();
		for (let index = 0; index < 8; index += 1) {
			await page
				.getByRole("button", { name: "text-input", exact: true })
				.click();
		}
		const canvas = page.getByTestId("builder-canvas");
		await canvas.evaluate(async (element) => {
			await Promise.all(
				element
					.getAnimations({ subtree: true })
					.map((animation) => animation.finished.catch(() => {})),
			);
			element.scrollTop = 180;
		});
		const nodes = await page.evaluateHandle(() => {
			const canvas = document.querySelector("[data-testid=builder-canvas]")!;
			return [
				canvas,
				...canvas.querySelectorAll("*"),
				document.querySelector('[aria-label="Form pages"]')!,
				document.querySelector("h1")!.parentElement!,
			];
		});
		const geometry = () =>
			page.evaluate(() =>
				[
					"[data-testid=builder-canvas]",
					'[aria-label="Form pages"]',
					"h1",
					"[data-testid=builder-left-sidebar]",
					"[data-testid=builder-right-sidebar]",
				].map((selector) => {
					const rect = document
						.querySelector(selector)!
						.getBoundingClientRect();
					return {
						x: rect.x,
						y: rect.y,
						width: rect.width,
						height: rect.height,
					};
				}),
			);
		const before = await geometry();
		const fieldIds = await canvas
			.locator("input")
			.evaluateAll((inputs) => inputs.map((input) => input.id));
		const toggle = page.getByRole("button", { name: "Customize", exact: true });
		for (let index = 0; index < 4; index += 1) {
			await toggle.click();
			await expect(toggle).toHaveAttribute(
				"aria-pressed",
				index % 2 === 0 ? "true" : "false",
			);
			await expect(page.getByRole("dialog")).toHaveCount(0);
			const heading = canvas.getByRole("heading", {
				name: "Contact Us",
				exact: true,
			});
			if (index % 2 === 0) {
				await expect(heading.locator("../..")).toHaveCSS("filter", "blur(0px)");
			} else {
				await expect(heading).toHaveCount(0);
			}
			await expect(
				tabs.getByRole("button", { name: "Page 2", exact: true }),
			).toHaveAttribute("aria-current", "page");
			expect(
				await nodes.evaluate((nodes) =>
					nodes.every((node) => node.isConnected),
				),
			).toBe(true);
			expect(await geometry()).toEqual(before);
			expect(await canvas.evaluate((element) => element.scrollTop)).toBe(180);
			expect(
				await canvas
					.locator("input")
					.evaluateAll((inputs) => inputs.map((input) => input.id)),
			).toEqual(fieldIds);
		}
		await toggle.click();
		await expandCustomizationSections(page, ["Colors & surfaces", "Submit button"]);
		await page
			.getByLabel("Choose button color", { exact: true })
			.fill("#334455");
		await expect(
			canvas.getByRole("button", { name: "Send message", exact: true }),
		).toHaveCSS("background-color", "rgb(51, 68, 85)");
		await page
			.getByRole("textbox", { name: "Submit button text", exact: true })
			.fill("  Send painted form  ");
		const painted = await geometry();
		const paintedScroll = await canvas.evaluate((element) => element.scrollTop);
		await toggle.click();
		expect(await geometry()).toEqual(painted);
		expect(await canvas.evaluate((element) => element.scrollTop)).toBe(
			paintedScroll,
		);
		expect(
			await nodes.evaluate((nodes) => nodes.every((node) => node.isConnected)),
		).toBe(true);
		await toggle.click();
		await expandCustomizationSections(page, ["Colors & surfaces"]);
		await expect(
			page.getByLabel("Choose button color", { exact: true }),
		).toHaveValue("#334455");
		await toggle.click();
		await page.getByRole("button", { name: "text-area", exact: true }).click();
		await expect(canvas.locator(".group\\/item")).toHaveCount(9);
	});
}

test("Save applies the visible customization before persisting it", async ({
	page,
}) => {
	await mockSession(page);
	let saved: Record<string, unknown> = {};
	await page.route("**/api/forms/new", (route) => {
		saved = route.request().postDataJSON();
		return route.fulfill({ json: { ...saved, id: "save-customization" } });
	});
	await page.route("**/api/forms/save-customization", (route) =>
		route.fulfill({
			json: { ...saved, id: "save-customization", status: "Active" },
		}),
	);
	await page.goto("/dashboard/builder/new-form?template=contact-us", {
		waitUntil: "networkidle",
	});
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expandCustomizationSections(page, ["Colors & surfaces", "Submit button"]);
	await page.getByLabel("Choose button color", { exact: true }).fill("#334455");
	await page
		.getByRole("textbox", { name: "Submit button text", exact: true })
		.fill("Send now");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect.poll(() => saved.submitButtonText).toBe("Send now");
	expect(saved.fields).toMatchObject({
		theme: { colors: { primary: "#334455" } },
	});
	await expect(
		page.getByRole("heading", { name: "Settings", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Customize", exact: true }),
	).toHaveAttribute("aria-pressed", "false");
});

for (const status of [200, 500]) {
	test(`an import from a canceled customization session cannot overwrite a new session (HTTP ${status})`, async ({
		page,
	}) => {
		let releaseImport!: () => void;
		const importGate = new Promise<void>((resolve) => {
			releaseImport = resolve;
		});
		await page.route("https://tweakcn.com/r/themes/**", async (route) => {
			await importGate;
			await route.fulfill({ status, body: ":root { --primary: #abcdef; }" });
		});
		await page.goto("/dashboard/builder/new-form?template=contact-us", {
			waitUntil: "networkidle",
		});
		const toggle = page.getByRole("button", { name: "Customize", exact: true });
		await toggle.click();
		await page
			.getByRole("button", { name: "Advanced customizations", exact: true })
			.click();
		await page
			.getByRole("button", { name: "Import or export a theme", exact: true })
			.click();
		await page
			.getByRole("textbox", { name: "Theme link from tweakcn", exact: true })
			.fill("https://tweakcn.com/themes/test");
		await page
			.getByRole("button", { name: "Import from link", exact: true })
			.click();
		await expect(
			page.getByRole("button", { name: "Importing...", exact: true }),
		).toBeVisible();
		await page.getByRole("button", { name: "Cancel", exact: true }).click();
		await toggle.click();
		await expect(
			page.getByTestId("builder-left-sidebar").locator("[inert]"),
		).toHaveCount(0);
		await page
			.getByLabel("Choose button color", { exact: true })
			.fill("#334455");
		await expect(page.getByTestId("builder-canvas")).toHaveCSS(
			"--primary",
			"#334455",
		);
		const completed = page.waitForResponse("https://tweakcn.com/r/themes/**");
		releaseImport();
		await (await completed).finished();
		await expect(
			page.getByLabel("Choose button color", { exact: true }),
		).toHaveValue("#334455");
		await expect(page.getByTestId("builder-canvas")).toHaveCSS(
			"--primary",
			"#334455",
		);
		await expect(page.getByText("Theme imported", { exact: true })).toHaveCount(
			0,
		);
		await expect(
			page.getByText(
				"Could not load this theme. Check that its tweakcn link is public.",
				{ exact: true },
			),
		).toHaveCount(0);
	});
}
