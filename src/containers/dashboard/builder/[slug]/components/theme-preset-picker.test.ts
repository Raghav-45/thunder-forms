import { describe, expect, it } from "vitest";
import communityThemes from "#/containers/dashboard/builder/[slug]/constants/community-themes.json";
import { isFormStructure } from "#/features/form-builder/form-structure";
import {
	createFormTheme,
	exportFormThemeCss,
	getFormThemeStyle,
	importFormThemeCss,
	importFormThemeVariables,
} from "#/features/form-builder/theme";

describe("tweakcn community presets", () => {
	it.each(
		communityThemes,
	)("preserves $name through import, save validation and CSS export", (preset) => {
		const theme = importFormThemeVariables(preset.variables, createFormTheme());
		expect(
			isFormStructure(
				JSON.parse(
					JSON.stringify({ pages: [{ id: "page", sections: [] }], theme }),
				),
			),
		).toBe(true);
		const style = getFormThemeStyle(theme) as Record<string, string>;
		expect(style["--primary"]).toBe(preset.variables.primary);
		expect(style["--chart-5"]).toBe(preset.variables["chart-5"]);
		expect(style["--sidebar-ring"]).toBe(preset.variables["sidebar-ring"]);
		// Two community exports mix commas with slash opacity; import repairs that syntax.
		const validHsl = (value: string) =>
			value.replace(/(hsla?)\(([^()]+)\)/gi, (match, name, channels) =>
				channels.includes(",") && channels.includes("/")
					? `${name}(${channels.replace(/,\s*/g, " ")})`
					: match,
			);
		expect(style["--shadow"]).toBe(validHsl(preset.variables.shadow));
		expect(style["--shadow-xl"]).toBe(validHsl(preset.variables["shadow-xl"]));
		expect(style.colorScheme).toBe("dark");
		const reimported = importFormThemeCss(
			exportFormThemeCss(theme),
			createFormTheme(),
		);
		expect(getFormThemeStyle(reimported)).toEqual(style);
		const registry = {
			cssVars: { theme: {}, light: {}, dark: preset.variables },
		};
		expect(
			getFormThemeStyle(
				importFormThemeCss(JSON.stringify(registry), createFormTheme()),
			),
		).toEqual(style);
	});
});
