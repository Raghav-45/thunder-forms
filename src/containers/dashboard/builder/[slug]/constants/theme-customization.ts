import type { FormColorToken, FormTheme } from "#/features/form-builder/theme";

export const BASIC_THEME_COLOR_GROUPS = [
	{
		label: "Form & question cards",
		description: "The canvas, question panels, and the text inside them.",
		tokens: ["background", "foreground", "card", "card-foreground"],
	},
	{
		label: "Buttons & messages",
		description: "Your call to action, helper text, and validation messages.",
		tokens: [
			"primary",
			"primary-foreground",
			"muted-foreground",
			"destructive",
		],
	},
	{
		label: "Fields & selection",
		description: "Field outlines and the color people see while answering.",
		tokens: ["input", "ring"],
	},
] as const satisfies readonly {
	label: string;
	description: string;
	tokens: readonly FormColorToken[];
}[];

export const BASIC_THEME_COLORS: readonly FormColorToken[] =
	BASIC_THEME_COLOR_GROUPS.flatMap((group) => group.tokens);

export const THEME_FONT_LABELS: Record<FormTheme["fontFamily"], string> = {
	system: "Default font",
	arial: "Arial",
	verdana: "Verdana",
	georgia: "Georgia",
	mono: "Typewriter",
};
