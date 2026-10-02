import { describe, expect, it } from "vitest";
import {
	isFormStructure,
	stripQuizAnswerKeys,
} from "#/features/form-builder/form-structure";
import {
	createFormTheme,
	exportFormThemeCss,
	FORM_THEME_PRESETS,
	getFormThemeFontUrls,
	getFormThemeStyle,
	getTweakcnRegistryUrl,
	importFormThemeCss,
	isFormTheme,
	isFormThemeColor,
	normalizeFormTheme,
} from "#/features/form-builder/theme";

describe("form themes", () => {
	it("keeps existing forms valid and preserves themes through public serialization", () => {
		const structure = { pages: [{ id: "page", sections: [] }] };
		expect(isFormStructure(structure)).toBe(true);
		const themed = { ...structure, theme: createFormTheme("ocean") };
		expect(isFormStructure(JSON.parse(JSON.stringify(themed)))).toBe(true);
		expect(stripQuizAnswerKeys(themed).theme).toEqual(themed.theme);
		expect(isFormStructure({ ...structure, theme: { colors: {} } })).toBe(
			false,
		);
	});

	it("creates independent valid palettes for every preset", () => {
		for (const preset of FORM_THEME_PRESETS) {
			const theme = createFormTheme(preset.id);
			expect(isFormTheme(theme)).toBe(true);
			expect(theme.colors.primary).toBe(preset.primary);
			expect(theme).not.toHaveProperty("mode");
			expect(theme).not.toHaveProperty("light");
			expect(theme).not.toHaveProperty("dark");
		}
		const theme = createFormTheme();
		theme.colors.primary = "#123456";
		expect(createFormTheme().colors.primary).not.toBe("#123456");
		expect(theme.colors.background).toBe("#0a0a0a");
	});

	it("rejects malformed and unbounded theme data", () => {
		const theme = createFormTheme();
		for (const invalid of [
			{ ...theme, colors: {} },
			{ ...theme, fontFamily: "__proto__" },
			{ ...theme, radius: -1 },
			{ ...theme, spacing: Number.NaN },
			{ ...theme, shadow: { ...theme.shadow, opacity: 2 } },
			{
				...theme,
				colors: { ...theme.colors, background: "url(https://example.com)" },
			},
		])
			expect(isFormTheme(invalid)).toBe(false);
		for (const color of [
			"#abc",
			"#123456",
			"oklch(0.5 0.2 270)",
			"hsl(210 80% 50%)",
			"rgb(12, 34, 56)",
		])
			expect(isFormThemeColor(color)).toBe(true);
		for (const color of [
			"var(--secret)",
			"red; display:none",
			"#12345",
			"</style>",
			"rgb(e)",
			"oklch(1)",
		])
			expect(isFormThemeColor(color)).toBe(false);
	});

	it("imports tweakcn dark overrides into one palette and keeps other settings", () => {
		const current = createFormTheme();
		current.fontFamily = "georgia";
		const imported = importFormThemeCss(
			":root { --primary: oklch(0.6 0.2 270); --primary-foreground: #fff; --radius: 0.5rem; } .dark { --primary: #a78bfa; }",
			current,
		);
		expect(imported.colors.primary).toBe("#a78bfa");
		expect(imported.colors["primary-foreground"]).toBe("#fff");
		expect(imported.radius).toBe(0.5);
		expect(imported.fontFamily).toBe("georgia");
		expect(current.colors.primary).not.toBe(imported.colors.primary);
		expect(
			importFormThemeCss(":root { --primary: oklch(0.6 0.2 270); }", current)
				.colors.primary,
		).toBe("oklch(0.6 0.2 270)");
		expect(() => importFormThemeCss("body { color: red; }", current)).toThrow();
		expect(() =>
			importFormThemeCss(":root { --primary: url(bad); }", current),
		).toThrow();
	});

	it("exports one palette and applies it with typography and shadows", () => {
		const theme = createFormTheme("forest");
		theme.fontFamily = "georgia";
		theme.shadow.opacity = 0.4;
		const css = exportFormThemeCss(theme);
		expect(css).toContain(":root {");
		expect(css).not.toContain(".dark {");
		expect(importFormThemeCss(css, createFormTheme()).colors).toEqual(
			theme.colors,
		);
		const style = getFormThemeStyle(theme) as Record<string, string>;
		expect(style["--primary"]).toBe(theme.colors.primary);
		expect(style.colorScheme).toBe("dark");
		expect(style.fontFamily).toContain("Georgia");
		expect(style["--shadow"]).toContain("40%");
		expect(getFormThemeStyle(undefined)).toBeUndefined();
	});

	it("reads both legacy formats and preserves only the previously selected palette", () => {
		const { colors, ...settings } = createFormTheme();
		for (const mode of ["light", "dark"] as const) {
			const legacy = {
				...settings,
				mode,
				light: { ...colors, primary: "#123456" },
				dark: { ...colors, primary: "#abcdef" },
			};
			expect(isFormTheme(legacy)).toBe(true);
			expect(
				isFormStructure({
					pages: [{ id: "page", sections: [] }],
					theme: legacy,
				}),
			).toBe(true);
			const normalized = normalizeFormTheme(legacy);
			expect(normalized.colors).toEqual(legacy[mode]);
			expect(normalized).not.toHaveProperty("mode");
			expect(normalized).not.toHaveProperty("light");
			expect(normalized).not.toHaveProperty("dark");
			expect(isFormTheme(normalized)).toBe(true);
			expect(getFormThemeStyle(legacy)).toEqual(getFormThemeStyle(normalized));
			expect(isFormTheme({ ...legacy, mode: "auto" })).toBe(false);
			expect(isFormTheme({ ...legacy, dark: {} })).toBe(false);
		}
	});

	it("imports fonts, raw and layered shadows, spacing, tracking and pixel radii from full CSS", () => {
		const css = `@import "tailwindcss";
		@layer base {
		  :root { --brand: 220 80% 50%; --primary: hsl(var(--brand)); --radius: 12px; --spacing: 0.27rem; --tracking-normal: -0.02em; --font-sans: Inter, sans-serif; --font-serif: Lora, serif; --font-mono: Fira Code, monospace; --shadow-x: 1px; --shadow-y: 4px; --shadow-blur: 50px; --shadow-spread: -12px; --shadow-opacity: 0.2; --shadow-color: #102030; }
		  .dark { --primary: 240 70% 60%; --shadow: 1px 4px 50px -12px rgba(16, 32, 48, 0.2), 1px 1px 2px -13px rgba(16, 32, 48, 0.2); }
		}`;
		const theme = importFormThemeCss(css, createFormTheme());
		expect(theme.colors.primary).toBe("hsl(240 70% 60%)");
		expect(theme.radius).toBe(0.75);
		expect(theme.spacing).toBe(0.27);
		expect(theme.letterSpacing).toBe(-0.02);
		expect(theme.fonts).toEqual({
			sans: "Inter, sans-serif",
			serif: "Lora, serif",
			mono: "Fira Code, monospace",
		});
		expect(theme.shadow).toEqual({
			x: 1,
			y: 4,
			blur: 50,
			spread: -12,
			opacity: 0.2,
			color: "#102030",
		});
		expect(theme.shadows?.shadow).toContain("rgba(16, 32, 48, 0.2),");
		expect(
			getFormThemeStyle(
				importFormThemeCss(exportFormThemeCss(theme), createFormTheme()),
			),
		).toEqual(getFormThemeStyle(theme));
	});

	it("imports typography alone and resolves a Next font alias to its fallback stack", () => {
		const theme = importFormThemeCss(
			":root { --font-sans: var(--font-montserrat), Montserrat, sans-serif; --tracking-normal: 0.5px; }",
			createFormTheme(),
		);
		expect(theme.fonts?.sans).toBe("Montserrat, sans-serif");
		expect(theme.letterSpacing).toBe(0.03125);
		expect(
			getFormThemeFontUrls(theme).some((url) =>
				url.includes("family=Montserrat"),
			),
		).toBe(true);
		expect(getFormThemeFontUrls(undefined)).toEqual([]);
	});

	it("quotes numeric font names and repairs community HSL shadow syntax", () => {
		const theme = importFormThemeCss(
			":root { --font-serif: Source Serif 4, serif; --shadow-color: 0, 0%, 0%; --shadow-xl: 0 4px 8px hsl(0, 0%, 0% / 0.5); }",
			createFormTheme(),
		);
		expect(theme.fonts?.serif).toBe('"Source Serif 4", serif');
		expect(theme.shadow.color).toBe("hsl(0 0% 0%)");
		expect(theme.shadows?.["shadow-xl"]).toBe("0 4px 8px hsl(0 0% 0% / 0.5)");
		expect(getFormThemeFontUrls(theme)).toContain(
			"https://fonts.googleapis.com/css2?family=Source%20Serif%204:wght@400;500;600;700&display=swap",
		);
	});

	it("keeps old single palettes valid when they lack chart, sidebar and font settings", () => {
		const theme = createFormTheme();
		delete theme.fonts;
		for (const token of Object.keys(theme.colors))
			if (token.startsWith("chart-") || token.startsWith("sidebar"))
				delete (theme.colors as Record<string, string>)[token];
		expect(isFormTheme(theme)).toBe(true);
		expect(normalizeFormTheme(theme).colors["chart-1"]).toBeDefined();
	});

	it("rejects broken references and unsafe values without mutating the current form", () => {
		const current = createFormTheme();
		const original = structuredClone(current);
		for (const css of [
			":root { --a: var(--b); --b: var(--a); --primary: var(--a); }",
			":root { --primary: var(--missing); }",
			":root { --font-sans: url(https://example.com/font); }",
			":root { --shadow: url(https://example.com/image); }",
			'{"cssVars":{"dark":{"primary":42}}}',
			'{"cssVars":',
		])
			expect(() => importFormThemeCss(css, current)).toThrow();
		expect(current).toEqual(original);
	});

	it("accepts tweakcn community, registry and editor links", () => {
		for (const url of [
			"https://tweakcn.com/themes/example",
			"https://tweakcn.com/r/themes/example.json",
			"https://tweakcn.com/editor/theme?theme=example",
		])
			expect(getTweakcnRegistryUrl(url)).toBe(
				"https://tweakcn.com/r/themes/example",
			);
		for (const url of [
			"https://example.com/themes/example",
			"http://tweakcn.com/themes/example",
			"https://tweakcn.com/community",
			"https://tweakcn.com/themes/../api/auth",
		])
			expect(() => getTweakcnRegistryUrl(url)).toThrow();
	});
});
