import type {
	FORM_COLOR_GROUPS,
	FormColorToken,
} from "#/features/form-builder/theme";

export const THEME_COLOR_LABELS: Record<FormColorToken, string> = {
	primary: "Button color",
	"primary-foreground": "Button text",
	secondary: "Tag color",
	"secondary-foreground": "Tag text",
	accent: "Hover color",
	"accent-foreground": "Text on hover",
	background: "Form background",
	foreground: "Form text",
	card: "Question cards",
	"card-foreground": "Question text",
	popover: "Menu background",
	"popover-foreground": "Menu text",
	muted: "Subtle background",
	"muted-foreground": "Help & description text",
	destructive: "Error messages",
	"destructive-foreground": "Text on error buttons",
	border: "Borders",
	input: "Field outlines",
	ring: "Selected & focused fields",
	"chart-1": "Chart 1",
	"chart-2": "Chart 2",
	"chart-3": "Chart 3",
	"chart-4": "Chart 4",
	"chart-5": "Chart 5",
	sidebar: "Side menu background",
	"sidebar-foreground": "Side menu text",
	"sidebar-primary": "Side menu button color",
	"sidebar-primary-foreground": "Side menu button text",
	"sidebar-accent": "Side menu hover color",
	"sidebar-accent-foreground": "Side menu text on hover",
	"sidebar-border": "Side menu borders",
	"sidebar-ring": "Side menu focus outline",
};

export const THEME_COLOR_GROUP_DETAILS: Record<
	(typeof FORM_COLOR_GROUPS)[number]["label"],
	{ label: string; description: string }
> = {
	Primary: {
		label: "Buttons & selections",
		description: "Submit buttons, checked boxes, and selected options.",
	},
	Secondary: {
		label: "Tags & secondary buttons",
		description: "Selected option tags and less prominent buttons.",
	},
	Accent: {
		label: "Hover highlights",
		description: "Highlights when hovering buttons or menu options.",
	},
	Base: {
		label: "Form",
		description: "The form's background and main text.",
	},
	Card: {
		label: "Sections",
		description: "The panels that group your questions.",
	},
	Popover: {
		label: "Menus & calendars",
		description: "Dropdown menus and date picker panels.",
	},
	Muted: {
		label: "Supporting content",
		description: "Subtle surfaces, descriptions, and helper text.",
	},
	Destructive: {
		label: "Errors & delete actions",
		description: "Validation messages and delete buttons.",
	},
	"Border & input": {
		label: "Borders & focus",
		description: "Dividers, field borders, and the outline of a focused field.",
	},
	Charts: {
		label: "Charts",
		description: "Chart colors included in imported themes.",
	},
	Sidebar: {
		label: "Side menu",
		description: "Side menu colors included in imported themes.",
	},
	"Sidebar primary": {
		label: "Side menu buttons",
		description: "Buttons and selections in an imported theme's side menu.",
	},
	"Sidebar accent": {
		label: "Side menu highlights",
		description: "Hover highlights in an imported theme's side menu.",
	},
	"Sidebar border": {
		label: "Side menu borders",
		description: "Borders and focus outlines in an imported theme's side menu.",
	},
};
