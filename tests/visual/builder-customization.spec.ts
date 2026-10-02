import { expect, type Page, test } from "@playwright/test";
import communityThemes from "#/containers/dashboard/builder/[slug]/constants/community-themes.json" with { type: "json" };
import { createFormTheme } from "#/features/form-builder/theme";

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
	await editor.getByRole("combobox", { name: "Theme preset" }).click();
	await page.getByRole("option", { name: "Ocean", exact: true }).click();
	await expect(editor.getByRole("tab", { name: "Light", exact: true })).toHaveCount(0);
	await expect(editor.getByRole("tab", { name: "Dark", exact: true })).toHaveCount(0);
	await expect(preview).toHaveAttribute("data-form-theme", "true");
	await expect(preview.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(96, 165, 250)");
	await editor.getByRole("button", { name: "Cancel", exact: true }).click();
	await expect(page.locator("[data-form-theme]")).toHaveCount(0);

	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await expect(preview).toHaveCSS("background-color", "rgb(10, 10, 10)");
	await editor.getByRole("tab", { name: "Typography", exact: true }).click();
	await editor.getByRole("combobox", { name: "Font family", exact: true }).click();
	await page.getByRole("option", { name: "Georgia", exact: true }).click();
	await expect(preview).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
	const tracking = editor.getByRole("slider", { name: "Letter spacing", exact: true });
	await tracking.focus();
	await tracking.press("ArrowRight");
	await expect(tracking).toHaveAttribute("aria-valuenow", "0.005");
	await editor.getByRole("tab", { name: "Other", exact: true }).click();
	const radius = editor.getByRole("slider", { name: "Corner radius", exact: true });
	await radius.focus();
	await radius.press("Home");
	await expect(preview.locator("section").first()).toHaveCSS("border-radius", "0px");
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.locator("[data-form-theme]")).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');

	await page.getByRole("button", { name: "Customize", exact: true }).click();
	await editor.getByRole("tab", { name: "Typography", exact: true }).click();
	await expect(editor.getByRole("combobox", { name: "Font family", exact: true })).toContainText("Georgia");
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
	await editor.getByRole("combobox", { name: "Theme preset" }).click();
	await page.getByRole("option", { name: "Ocean", exact: true }).click();
	await editor.getByText("Import or export CSS", { exact: true }).click();
	await editor.getByRole("textbox", { name: "Theme CSS", exact: true }).fill(":root { --popover: #ffeedd; --popover-foreground: #112233; } .dark { --primary: #334455; }");
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await editor.getByRole("button", { name: "Apply changes", exact: true }).click();
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect.poll(() => saved.id).toBe("theme-test");
	expect(saved.fields).toMatchObject({ theme: { colors: { primary: "#334455", popover: "#ffeedd" } } });
	const savedTheme = (saved.fields as { theme: object }).theme;
	expect(savedTheme).not.toHaveProperty("mode");
	expect(savedTheme).not.toHaveProperty("light");
	expect(savedTheme).not.toHaveProperty("dark");
	await page.goto("/forms/theme-test", { waitUntil: "networkidle" });
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(51, 68, 85)");
	await page.getByRole("combobox").click();
	await expect(page.getByRole("listbox")).toHaveCSS("background-color", "rgb(255, 238, 221)");
	await expect(page.getByRole("listbox")).toHaveCSS("color", "rgb(17, 34, 51)");
	await page.keyboard.press("Escape");
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(51, 68, 85)");
	await expect(page.locator("[data-form-theme]")).toHaveAttribute("data-form-theme", "true");
});

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
	await editor.getByRole("combobox", { name: "Theme preset" }).click();
	await page.getByRole("combobox", { name: "Search themes or creators" }).fill(preset.author);
	await expect(page.getByRole("option", { name: preset.name, exact: true })).toBeVisible();
	await testInfo.attach("community-picker", { body: await page.screenshot(), contentType: "image/png" });
	await page.getByRole("option", { name: preset.name, exact: true }).click();
	await expect(editor.getByRole("link", { name: `View ${preset.name} by ${preset.author} on tweakcn` })).toHaveAttribute("href", preset.url);
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	await expect(preview).toHaveCSS("--chart-5", preset.variables["chart-5"]);
	await expect(preview).toHaveCSS("--sidebar-ring", preset.variables["sidebar-ring"]);
	await expect(preview).toHaveCSS("--shadow-xl", preset.variables["shadow-xl"]);
	await editor.getByRole("textbox", { name: "Search colors" }).fill("charts");
	await expect(editor.getByRole("textbox", { name: "Chart 5", exact: true })).toHaveValue(preset.variables["chart-5"]);
	await editor.getByRole("tab", { name: "Typography", exact: true }).click();
	await expect(editor.getByRole("textbox", { name: "Primary font stack" })).toHaveValue(preset.variables["font-sans"]);
	await expect(editor.getByRole("textbox", { name: "Serif font stack" })).toHaveValue("Lora, serif");
	await expect(editor.getByRole("textbox", { name: "Monospace font stack" })).toHaveValue("IBM Plex Mono, monospace");
	await editor.getByRole("tab", { name: "Other", exact: true }).click();
	await editor.getByText("Shadow scale", { exact: true }).click();
	await expect(editor.getByRole("textbox", { name: "Shadow xl", exact: true })).toHaveValue(preset.variables["shadow-xl"]);
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
	await editor.getByText("Import or export CSS", { exact: true }).click();
	const link = editor.getByRole("textbox", { name: "tweakcn theme link" });
	await link.fill("https://example.com/theme");
	await editor.getByRole("button", { name: "Import from link", exact: true }).click();
	await expect(editor.getByRole("alert")).toContainText("tweakcn.com");
	await expect(preview).toHaveCSS("--primary", "#f4ce4c");
	await link.fill(`https://tweakcn.com/editor/theme?theme=${preset.id}`);
	await editor.getByRole("button", { name: "Import from link", exact: true }).click();
	await expect(preview).toHaveCSS("--primary", preset.variables.primary);
	await expect(preview).toHaveCSS("--spacing", "0.27rem");
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	const css = editor.getByRole("textbox", { name: "Theme CSS", exact: true });
	await css.fill(':root { --font-sans: url(https://example.com/font); }');
	await editor.getByRole("button", { name: "Import theme", exact: true }).click();
	await expect(editor.getByRole("alert")).toContainText("Invalid font stack");
	await expect(preview).toHaveCSS("font-family", '"Plus Jakarta Sans", sans-serif');
	const file = editor.getByLabel("Import a CSS or JSON file", { exact: true });
	await file.setInputFiles({ name: "theme.css", mimeType: "text/css", buffer: Buffer.from(':root { --primary: #112233; --radius: 8px; --spacing: 0.3rem; --font-sans: Arial, sans-serif; --shadow-color: 0, 0%, 0%; --shadow-xl: 0 4px 8px hsl(0, 0%, 0% / 0.5); } .dark { --primary: #abcdef; }') });
	await expect(preview).toHaveCSS("--primary", "#abcdef");
	await expect(preview).toHaveCSS("--radius", "0.5rem");
	await expect(preview).toHaveCSS("--spacing", "0.3rem");
	await expect(preview).toHaveCSS("--shadow-xl", "0 4px 8px hsl(0 0% 0% / 0.5)");
	await file.setInputFiles({ name: "theme.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ cssVars: { dark: preset.variables } })) });
	await expect(preview).toHaveCSS("--primary", preset.variables.primary);
	await editor.getByRole("button", { name: "Copy CSS", exact: true }).click();
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
