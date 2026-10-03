import { expect, type Locator, type Page, test } from "@playwright/test";
import communityThemes from "#/containers/dashboard/builder/[slug]/constants/community-themes.json" with { type: "json" };
import { THEME_COLOR_LABELS } from "#/containers/dashboard/builder/[slug]/constants/theme-color-labels";
import { BASIC_THEME_COLORS } from "#/containers/dashboard/builder/[slug]/constants/theme-customization";
import { createFormTheme, getFormThemeStyle, importFormThemeVariables } from "#/features/form-builder/theme";

async function mockSession(page: Page) {
	await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: {
		session: { id: "theme-session", userId: "theme-user", expiresAt: "2099-01-01T00:00:00.000Z", token: "local-test" },
		user: { id: "theme-user", name: "Theme tester", email: "theme@example.com", emailVerified: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
	} }));
}

test("customizations preview live, cancel cleanly, apply and reset", async ({ page }) => {
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "text-input", exact: true }).click();
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.getByRole("dialog", { name: "Customize your form" });
	const preview = page.getByTestId("customization-preview");
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
	await expect(preview).toHaveCSS("background-color", "rgb(10, 10, 10)");
	await editor.getByRole("combobox", { name: "Text font", exact: true }).click();
	await page.getByRole("option", { name: "Georgia", exact: true }).click();
	await expect(preview).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
	const tracking = editor.getByRole("slider", { name: "Letter spacing", exact: true });
	await tracking.focus();
	await tracking.press("ArrowRight");
	await expect(tracking).toHaveAttribute("aria-valuenow", "0.005");
	await editor.getByRole("tab", { name: "Layout", exact: true }).click();
	const radius = editor.getByRole("slider", { name: "Corner rounding", exact: true });
	await radius.focus();
	await radius.press("Home");
	await expect(preview.locator("section").first()).toHaveCSS("border-radius", "0px");
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
		"rgb(10, 10, 10)",
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
	const editor = page.getByRole("dialog", { name: "Customize your form" });
	const preview = page.getByTestId("customization-preview");
	await editor.getByRole("tab", { name: "Layout", exact: true }).click();
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
	await editor.getByRole("tab", { name: "Appearance", exact: true }).click();
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
		const editor = page.getByRole("dialog", { name: "Customize your form" });
		const preview = page.getByTestId("customization-preview");
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
			await page.setViewportSize(viewport);
			await page.getByRole("button", { name: "Customize", exact: true }).click();
			await editor.getByRole("tab", { name: "Layout", exact: true }).click();
			const heading = editor.getByRole("region", { name: "Form heading", exact: true });
			const sections = editor.getByRole("region", { name: "Sections & spacing", exact: true });
			const submit = editor.getByRole("region", { name: "Submit button", exact: true });
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
				await editor.getByRole("tab", { name: "Layout", exact: true }).click();
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
				await editor.getByRole("tab", { name: "Preview", exact: true }).click();
			}
			const fullWidth = mode.value === "full" || (mode.value === "responsive" && viewport.name === "mobile");
			const previewButton = preview.getByRole("button", { name: "Send response", exact: true });
			await expectWidth(previewButton, fullWidth);
			if (!fullWidth) await expect(previewButton.locator("..")).toHaveCSS("justify-content", "flex-end");
			await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
			await page.getByRole("button", { name: "Customize", exact: true }).click();
			await editor.getByRole("tab", { name: "Layout", exact: true }).click();
			await expect(submit.getByRole("textbox", { name: "Submit button text", exact: true })).toHaveValue("Send response");
			await expect(submit.getByRole("combobox", { name: "Button width", exact: true })).toContainText(mode.label);
			if (mode.value === "full") {
				await editor.getByRole("button", { name: "Reset to original", exact: true }).click();
				await page.getByRole("button", { name: "Customize", exact: true }).click();
				await editor.getByRole("tab", { name: "Layout", exact: true }).click();
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
			await page.goto("/forms/submit-button-test", { waitUntil: "networkidle" });
			const publicButton = page.getByRole("button", { name: "Send response", exact: true });
			await expectWidth(publicButton, fullWidth);
			if (!fullWidth) await expect(publicButton.locator("..")).toHaveCSS("justify-content", "flex-end");
			await page.reload({ waitUntil: "networkidle" });
			await expectWidth(publicButton, fullWidth);
		}
	});
}

test("customization is usable on mobile and the app stays dark with light browser preferences", async ({ page }, testInfo) => {
	await page.addInitScript(() => localStorage.setItem("theme", "light"));
	await page.emulateMedia({ colorScheme: "light" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
	await expect(page.locator("html")).toHaveClass("dark");
	await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
	await page.getByRole("button", { name: "Customize", exact: true }).click();
	const editor = page.getByRole("dialog", { name: "Customize your form" });
	await expect(editor).toBeVisible();
	await expect(editor.getByRole("button", { name: "Apply changes", exact: true })).toBeInViewport();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	const preview = page.getByTestId("customization-preview");
	await editor.getByRole("tab", { name: "Preview", exact: true }).click();
	await expect(preview).toBeVisible();
	await expect(preview.getByRole("textbox").first()).toHaveCSS("background-color", "rgb(10, 10, 10)");
	await testInfo.attach("customization-mobile", { body: await page.screenshot(), contentType: "image/png" });
	await page.setViewportSize({ width: 1440, height: 1000 });
	await testInfo.attach("customization-desktop", { body: await page.screenshot(), contentType: "image/png" });
	await editor.getByRole("button", { name: "Cancel", exact: true }).click();
	await expect(page.getByRole("button", { name: "Customize", exact: true })).toBeFocused();
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
	const preview = page.getByTestId("customization-preview");
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
	const editor = page.getByRole("dialog", { name: "Customize your form" });
	const preview = page.getByTestId("customization-preview");
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
	const editor = page.getByRole("dialog", { name: "Customize your form" });
	const preview = page.getByTestId("customization-preview");
	await editor.getByRole("button", { name: "Advanced customizations", exact: true }).click();
	await editor.getByText("Import or export a theme", { exact: true }).click();
	const link = editor.getByRole("textbox", { name: "Theme link from tweakcn" });
	await link.fill("https://example.com/theme");
	await editor.getByRole("button", { name: "Import from link", exact: true }).click();
	await expect(editor.getByRole("alert")).toContainText("tweakcn.com");
	await expect(preview).toHaveCSS("--primary", "#f4ce4c");
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

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
	test(`basic controls and advanced accordions preserve every setting on ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
		const preset = communityThemes.find((theme) => theme.name === "Sage Green")!;
		await page.goto("/dashboard/builder/new-form", { waitUntil: "networkidle" });
		await page.getByRole("button", { name: "Customize", exact: true }).click();
		const editor = page.getByRole("dialog", { name: "Customize your form" });
		const basic = editor.getByRole("region", { name: "Make it yours", exact: true });
		const full = editor.getByRole("region", { name: "Advanced customizations", exact: true });
		const preview = page.getByTestId("customization-preview");
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
		await editor.getByRole("tab", { name: "Layout", exact: true }).click();
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
		await editor.getByRole("tab", { name: "Appearance", exact: true }).click();
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
