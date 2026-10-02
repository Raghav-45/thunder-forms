import type { FormColorToken, FormTheme } from "#/features/form-builder/theme";

export const BASIC_THEME_COLORS = [
	"primary",
	"primary-foreground",
	"background",
	"foreground",
	"card",
	"muted-foreground",
	"input",
	"ring",
] as const satisfies readonly FormColorToken[];

export const THEME_FONT_LABELS: Record<FormTheme["fontFamily"], string> = {
	system: "Default font",
	arial: "Arial",
	verdana: "Verdana",
	georgia: "Georgia",
	mono: "Typewriter",
};
