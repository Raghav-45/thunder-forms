import type { CSSProperties } from "react";

export const FORM_COLOR_GROUPS = [
	{ label: "Primary", tokens: ["primary", "primary-foreground"] },
	{ label: "Secondary", tokens: ["secondary", "secondary-foreground"] },
	{ label: "Accent", tokens: ["accent", "accent-foreground"] },
	{ label: "Base", tokens: ["background", "foreground"] },
	{ label: "Card", tokens: ["card", "card-foreground"] },
	{ label: "Popover", tokens: ["popover", "popover-foreground"] },
	{ label: "Muted", tokens: ["muted", "muted-foreground"] },
	{ label: "Destructive", tokens: ["destructive", "destructive-foreground"] },
	{ label: "Border & input", tokens: ["border", "input", "ring"] },
	{
		label: "Charts",
		tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
	},
	{ label: "Sidebar", tokens: ["sidebar", "sidebar-foreground"] },
	{
		label: "Sidebar primary",
		tokens: ["sidebar-primary", "sidebar-primary-foreground"],
	},
	{
		label: "Sidebar accent",
		tokens: ["sidebar-accent", "sidebar-accent-foreground"],
	},
	{ label: "Sidebar border", tokens: ["sidebar-border", "sidebar-ring"] },
] as const;

export type FormColorToken =
	(typeof FORM_COLOR_GROUPS)[number]["tokens"][number];
type CoreColorToken = Exclude<
	FormColorToken,
	`chart-${number}` | "sidebar" | `sidebar-${string}`
>;
export type FormThemeColors = Record<CoreColorToken, string> &
	Partial<Record<FormColorToken, string>>;

export const FORM_SHADOW_TOKENS = [
	"shadow-2xs",
	"shadow-xs",
	"shadow-sm",
	"shadow",
	"shadow-md",
	"shadow-lg",
	"shadow-xl",
	"shadow-2xl",
] as const;
export const FORM_TRACKING_TOKENS = [
	"tighter",
	"tight",
	"wide",
	"wider",
	"widest",
] as const;

export const FORM_FONTS = {
	system: {
		label: "System sans",
		value:
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	},
	arial: { label: "Arial", value: 'Arial, "Helvetica Neue", sans-serif' },
	verdana: { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
	georgia: { label: "Georgia", value: 'Georgia, "Times New Roman", serif' },
	mono: {
		label: "System mono",
		value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
	},
} as const;

export interface FormTheme {
	colors: FormThemeColors;
	fontFamily: keyof typeof FORM_FONTS;
	fonts?: { sans: string; serif: string; mono: string };
	shadows?: Partial<Record<(typeof FORM_SHADOW_TOKENS)[number], string>>;
	tracking?: Partial<Record<(typeof FORM_TRACKING_TOKENS)[number], string>>;
	letterSpacing: number;
	radius: number;
	spacing: number;
	shadow: {
		color: string;
		opacity: number;
		blur: number;
		spread: number;
		x: number;
		y: number;
	};
}

// Read older saved forms without changing their selected colors. New saves
// contain only one palette in `colors`.
interface LegacyFormTheme extends Omit<FormTheme, "colors"> {
	mode: "light" | "dark";
	light: FormThemeColors;
	dark: FormThemeColors;
}

export type StoredFormTheme = FormTheme | LegacyFormTheme;

const DEFAULT_COLORS: FormThemeColors = {
	background: "#0a0a0a",
	foreground: "#ebebeb",
	card: "#141414",
	"card-foreground": "#ebebeb",
	popover: "#1a1a1a",
	"popover-foreground": "#ebebeb",
	primary: "#f4ce4c",
	"primary-foreground": "#000000",
	secondary: "#262626",
	"secondary-foreground": "#ebebeb",
	accent: "#fff0c2",
	"accent-foreground": "#141414",
	muted: "#262626",
	"muted-foreground": "#999999",
	destructive: "#ff444b",
	"destructive-foreground": "#ffffff",
	border: "#222222",
	input: "#444444",
	ring: "#f4ce4c",
	"chart-1": "#f4ce4c",
	"chart-2": "#ea9a4a",
	"chart-3": "#60a5fa",
	"chart-4": "#e879f9",
	"chart-5": "#4ade80",
	sidebar: "#171717",
	"sidebar-foreground": "#ebebeb",
	"sidebar-primary": "#f4ce4c",
	"sidebar-primary-foreground": "#000000",
	"sidebar-accent": "#302b1c",
	"sidebar-accent-foreground": "#f4ce4c",
	"sidebar-border": "#302b1c",
	"sidebar-ring": "#f4ce4c",
};

interface FormThemePreset {
	id: string;
	label: string;
	description: string;
	primary: string;
	foreground: string;
	palette?: Pick<
		FormThemeColors,
		"background" | "card" | "foreground" | "muted-foreground" | "border"
	> & { input?: string; destructive?: string };
	fontFamily?: FormTheme["fontFamily"];
	radius?: number;
	spacing?: number;
	letterSpacing?: number;
	shadow?: Partial<FormTheme["shadow"]>;
	shadows?: FormTheme["shadows"];
}

export const FORM_THEME_PRESETS: readonly FormThemePreset[] = [
	{
		id: "thunder",
		label: "Thunder",
		description: "Our classic dark style with golden buttons",
		primary: "#f4ce4c",
		foreground: "#171717",
	},
	{
		id: "neon-arcade",
		label: "Neon Arcade",
		description: "Glowing pink, deep purple and typewriter text",
		primary: "#ff79d9",
		foreground: "#210b32",
		palette: {
			background: "#100622",
			card: "#281244",
			foreground: "#fcecff",
			"muted-foreground": "#c9aedb",
			border: "#9254ba",
			input: "#ad6bd6",
		},
		fontFamily: "mono",
		radius: 0.3,
		spacing: 0.275,
		letterSpacing: 0.015,
		shadow: { color: "#e34ccb", opacity: 0.35, blur: 28, y: 0 },
		shadows: {
			shadow: "0 0 0 1px #9254ba, 0 0 28px 0 rgba(227, 76, 203, 0.35)",
		},
	},
	{
		id: "terminal",
		label: "Green Terminal",
		description: "Green on black, square edges and compact fields",
		primary: "#a0ff76",
		foreground: "#07150b",
		palette: {
			background: "#041009",
			card: "#0c1c12",
			foreground: "#c4ffd3",
			"muted-foreground": "#8cbb98",
			border: "#438857",
		},
		fontFamily: "mono",
		radius: 0,
		spacing: 0.22,
		letterSpacing: 0.035,
		shadow: { opacity: 0, blur: 0, y: 0 },
	},
	{
		id: "bold-blocks",
		label: "Bold Blocks",
		description: "Sunflower yellow, square cards and hard shadows",
		primary: "#211b0c",
		foreground: "#ffdf64",
		palette: {
			background: "#ffdf64",
			card: "#fff2ba",
			foreground: "#211b0c",
			"muted-foreground": "#62542b",
			border: "#211b0c",
			destructive: "#b32035",
		},
		fontFamily: "arial",
		radius: 0,
		spacing: 0.3,
		letterSpacing: 0.01,
		shadow: { color: "#211b0c", opacity: 1, blur: 0, x: 6, y: 6 },
		shadows: { shadow: "6px 6px 0 0 #211b0c" },
	},
	{
		id: "bubblegum",
		label: "Bubblegum",
		description: "Pink and plum with soft, oversized curves",
		primary: "#ffb5de",
		foreground: "#39182e",
		palette: {
			background: "#2d1530",
			card: "#512653",
			foreground: "#ffeafb",
			"muted-foreground": "#e0bbd8",
			border: "#b27ca6",
		},
		fontFamily: "verdana",
		radius: 2.25,
		spacing: 0.34,
		letterSpacing: 0.01,
		shadow: { color: "#ff77c8", opacity: 0.2, blur: 36, y: 10, spread: -6 },
	},
	{
		id: "blueprint",
		label: "Blueprint",
		description: "Blueprint blue, crisp outlines and square fields",
		primary: "#ccecff",
		foreground: "#08224c",
		palette: {
			background: "#06224d",
			card: "#123c77",
			foreground: "#ecf6ff",
			"muted-foreground": "#b9d9f5",
			border: "#729fd0",
		},
		fontFamily: "mono",
		radius: 0,
		spacing: 0.25,
		letterSpacing: 0.02,
		shadow: { color: "#031329", opacity: 0.65, blur: 0, x: 4, y: 4 },
	},
	{
		id: "paper-ink",
		label: "Paper & Ink",
		description: "Warm paper, bookish text and clean edges",
		primary: "#352a20",
		foreground: "#fff8e9",
		palette: {
			background: "#efe3c6",
			card: "#fff8e9",
			foreground: "#352a20",
			"muted-foreground": "#73634d",
			border: "#aa9578",
			destructive: "#b32035",
		},
		fontFamily: "georgia",
		radius: 0.15,
		spacing: 0.29,
		letterSpacing: 0,
		shadow: { color: "#68573e", opacity: 0.2, blur: 0, y: 4 },
	},
	{
		id: "midnight-gold",
		label: "Midnight Gold",
		description: "Black and gold with elegant text and room to breathe",
		primary: "#e7c071",
		foreground: "#21180b",
		palette: {
			background: "#100e0b",
			card: "#242017",
			foreground: "#f8edda",
			"muted-foreground": "#c1ad86",
			border: "#8f784b",
		},
		fontFamily: "georgia",
		radius: 0.4,
		spacing: 0.35,
		letterSpacing: 0.02,
		shadow: { color: "#000000", opacity: 0.55, blur: 32, y: 12, spread: -4 },
	},
	{
		id: "royal-blue",
		label: "Royal Blue",
		description: "A vivid blue canvas with bold, layered cards",
		primary: "#d4f1ff",
		foreground: "#092960",
		palette: {
			background: "#153bb8",
			card: "#0a215b",
			foreground: "#eef6ff",
			"muted-foreground": "#bbd2ff",
			border: "#668ff3",
		},
		fontFamily: "arial",
		radius: 0.55,
		spacing: 0.28,
		letterSpacing: -0.015,
		shadow: { color: "#05112f", opacity: 0.7, blur: 0, y: 8 },
	},
	{
		id: "cherry-pop",
		label: "Cherry Pop",
		description: "Cherry red, burgundy panels and playful corners",
		primary: "#ff8091",
		foreground: "#3e0d1c",
		palette: {
			background: "#280d17",
			card: "#521c2e",
			foreground: "#fff0f2",
			"muted-foreground": "#e5b8c4",
			border: "#b45c75",
		},
		fontFamily: "verdana",
		radius: 1.1,
		spacing: 0.29,
		letterSpacing: -0.01,
		shadow: { color: "#c93c61", opacity: 0.6, blur: 0, x: 5, y: 5 },
	},
	{
		id: "lavender-cloud",
		label: "Lavender Cloud",
		description: "Pastel lavender, airy cards and gentle shadows",
		primary: "#6743a1",
		foreground: "#ffffff",
		palette: {
			background: "#eae2fc",
			card: "#faf7ff",
			foreground: "#35224e",
			"muted-foreground": "#6c5788",
			border: "#ac97cb",
			destructive: "#b32035",
		},
		fontFamily: "verdana",
		radius: 2,
		spacing: 0.32,
		letterSpacing: 0,
		shadow: { color: "#604090", opacity: 0.18, blur: 34, y: 12, spread: -6 },
	},
	{
		id: "mint-studio",
		label: "Mint Studio",
		description: "Fresh mint, rounded panels and a lifted finish",
		primary: "#176444",
		foreground: "#ffffff",
		palette: {
			background: "#d5f4e2",
			card: "#f4fff8",
			foreground: "#163d2d",
			"muted-foreground": "#506c5d",
			border: "#7fa68e",
			destructive: "#b32035",
		},
		fontFamily: "arial",
		radius: 1.2,
		spacing: 0.285,
		letterSpacing: 0.005,
		shadow: { color: "#21613f", opacity: 0.2, blur: 0, y: 7 },
	},
	{
		id: "sunset",
		label: "Sunset",
		description: "Warm copper, peach buttons and generous curves",
		primary: "#ffbc89",
		foreground: "#41190d",
		palette: {
			background: "#351610",
			card: "#633025",
			foreground: "#fff0df",
			"muted-foreground": "#e3bda5",
			border: "#bb8169",
		},
		fontFamily: "georgia",
		radius: 1.35,
		spacing: 0.31,
		letterSpacing: 0,
		shadow: { color: "#140705", opacity: 0.55, blur: 24, y: 10 },
	},
	{
		id: "arctic",
		label: "Arctic",
		description: "Icy blue, clear text and neat, compact shapes",
		primary: "#006b9f",
		foreground: "#ffffff",
		palette: {
			background: "#dff4fc",
			card: "#f6fcff",
			foreground: "#173b4f",
			"muted-foreground": "#496978",
			border: "#83a9bd",
			destructive: "#b32035",
		},
		fontFamily: "verdana",
		radius: 0.35,
		spacing: 0.24,
		letterSpacing: 0.01,
		shadow: { color: "#226581", opacity: 0.14, blur: 16, y: 4 },
	},
	{
		id: "ink-ivory",
		label: "Ink & Ivory",
		description: "Black and ivory, timeless text and flat edges",
		primary: "#f7f0df",
		foreground: "#1d1913",
		palette: {
			background: "#10100f",
			card: "#25231f",
			foreground: "#f7f0df",
			"muted-foreground": "#c0b8a6",
			border: "#8c8473",
		},
		fontFamily: "georgia",
		radius: 0,
		spacing: 0.31,
		letterSpacing: -0.015,
		shadow: { opacity: 0, blur: 0, y: 0 },
	},
	{
		id: "retro-console",
		label: "Retro Console",
		description: "Amber typewriter text with a vintage screen feel",
		primary: "#ffd084",
		foreground: "#2b1c0c",
		palette: {
			background: "#21190d",
			card: "#392b17",
			foreground: "#ffe1aa",
			"muted-foreground": "#d4b580",
			border: "#a6874c",
		},
		fontFamily: "mono",
		radius: 0.2,
		spacing: 0.23,
		letterSpacing: 0.025,
		shadow: { color: "#efb04d", opacity: 0.18, blur: 18, y: 0 },
	},
	{
		id: "citrus-punch",
		label: "Citrus Punch",
		description: "Lime green, deep olive and chunky rounded shapes",
		primary: "#d8ff7d",
		foreground: "#20320b",
		palette: {
			background: "#182309",
			card: "#2e3d16",
			foreground: "#f1ffdc",
			"muted-foreground": "#c5d69e",
			border: "#849f51",
		},
		fontFamily: "verdana",
		radius: 1.75,
		spacing: 0.33,
		letterSpacing: 0.005,
		shadow: { color: "#94bf36", opacity: 0.25, blur: 28, y: 8, spread: -4 },
	},
	{
		id: "neutral",
		label: "Neutral",
		description: "Classic dark surfaces with white buttons",
		primary: "#fafafa",
		foreground: "#171717",
	},
	{
		id: "ocean",
		label: "Ocean",
		description: "Classic dark surfaces with blue buttons",
		primary: "#60a5fa",
		foreground: "#171717",
	},
	{
		id: "rose",
		label: "Rose",
		description: "Classic dark surfaces with rose buttons",
		primary: "#fb7185",
		foreground: "#171717",
	},
	{
		id: "forest",
		label: "Forest",
		description: "Classic dark surfaces with green buttons",
		primary: "#4ade80",
		foreground: "#171717",
	},
	{
		id: "violet",
		label: "Violet",
		description: "Classic dark surfaces with violet buttons",
		primary: "#a78bfa",
		foreground: "#171717",
	},
];

export function createFormTheme(presetId = "thunder"): FormTheme {
	const preset =
		FORM_THEME_PRESETS.find((candidate) => candidate.id === presetId) ??
		FORM_THEME_PRESETS[0];
	const palette = preset.palette;
	const fontFamily = preset.fontFamily ?? "system";
	return {
		colors: {
			...DEFAULT_COLORS,
			...(palette && {
				...palette,
				"card-foreground": palette.foreground,
				popover: palette.card,
				"popover-foreground": palette.foreground,
				secondary: palette.card,
				"secondary-foreground": palette.foreground,
				accent: palette.card,
				"accent-foreground": palette.foreground,
				muted: palette.card,
				input: palette.input ?? palette.border,
				sidebar: palette.card,
				"sidebar-foreground": palette.foreground,
				"sidebar-primary": preset.primary,
				"sidebar-primary-foreground": preset.foreground,
				"sidebar-accent": palette.card,
				"sidebar-accent-foreground": palette.foreground,
				"sidebar-border": palette.border,
				"sidebar-ring": preset.primary,
				"chart-1": preset.primary,
			}),
			primary: preset.primary,
			"primary-foreground": preset.foreground,
			ring: preset.primary,
		},
		fontFamily,
		fonts: {
			sans: FORM_FONTS[fontFamily].value,
			serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
			mono: FORM_FONTS.mono.value,
		},
		letterSpacing: preset.letterSpacing ?? 0,
		radius: preset.radius ?? 0.75,
		spacing: preset.spacing ?? 0.25,
		shadow: {
			color: "#000000",
			opacity: 0.1,
			blur: 8,
			spread: 0,
			x: 0,
			y: 2,
			...preset.shadow,
		},
		...(preset.shadows && { shadows: { ...preset.shadows } }),
	};
}

// Values remain CSS property values, never stylesheets or remote resources.
export function isFormThemeColor(value: unknown): value is string {
	if (typeof value !== "string" || value.length > 500) return false;
	if (/^color-mix\(/i.test(value)) return isFormThemeShadow(value);
	if (
		/^(?:transparent|currentColor|black|white|red|green|blue|gray|grey|yellow|orange|purple|pink|cyan|magenta|lime|navy|teal|silver|maroon|olive|aqua|fuchsia|rebeccapurple)$/i.test(
			value,
		)
	)
		return true;
	if (/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8})$/i.test(value)) return true;
	const channels = value
		.match(/^(?:oklch|oklab|lab|lch|hsl|hsla|rgb|rgba|color)\(([^)]+)\)$/i)?.[1]
		?.trim()
		.split(/[\s,/]+/);
	return Boolean(
		channels &&
			(channels.length === 3 ||
				channels.length === 4 ||
				channels.length === 5) &&
			channels.every((channel) =>
				/^(?:[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg|rad|grad|turn)?|none|srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)$/i.test(
					channel,
				),
			),
	);
}

export function isFormThemeFont(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length <= 500 &&
		/^[\p{L}\p{N}\s.,'"_-]+$/u.test(value)
	);
}

export function isFormThemeShadow(value: unknown): value is string {
	if (
		typeof value !== "string" ||
		!value.trim() ||
		value.length > 2000 ||
		!/^[\w\s#.,%()/+-]+$/.test(value)
	)
		return false;
	const functions = [...value.matchAll(/([\w-]+)\s*\(/g)];
	return functions.every((match) =>
		/^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix|calc|var)$/.test(
			match[1],
		),
	);
}

export function isFormThemeTracking(value: unknown): value is string {
	return (
		typeof value === "string" &&
		(/^[+-]?(?:\d*\.)?\d+(?:em|rem|px)$/.test(value) ||
			/^calc\(var\(--tracking-normal\)\s*[+-]\s*[\d.]+em\)$/.test(value))
	);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const inRange = (value: unknown, min: number, max: number) =>
	typeof value === "number" &&
	Number.isFinite(value) &&
	value >= min &&
	value <= max;

export function isFormTheme(value: unknown): value is StoredFormTheme {
	if (!isRecord(value) || !isRecord(value.shadow)) return false;
	const palettes = Object.hasOwn(value, "colors")
		? [value.colors]
		: value.mode === "light" || value.mode === "dark"
			? [value.light, value.dark]
			: [];
	return (
		palettes.length > 0 &&
		palettes.every(
			(colors) =>
				isRecord(colors) &&
				FORM_COLOR_GROUPS.every((group) =>
					group.tokens.every(
						(token) =>
							(colors[token] === undefined &&
								(token.startsWith("chart-") || token.startsWith("sidebar"))) ||
							isFormThemeColor(colors[token]),
					),
				),
		) &&
		typeof value.fontFamily === "string" &&
		Object.hasOwn(FORM_FONTS, value.fontFamily) &&
		(value.fonts === undefined ||
			(isRecord(value.fonts) &&
				["sans", "serif", "mono"].every((key) =>
					isFormThemeFont((value.fonts as Record<string, unknown>)[key]),
				))) &&
		(value.shadows === undefined ||
			(isRecord(value.shadows) &&
				Object.entries(value.shadows).every(
					([key, shadow]) =>
						(FORM_SHADOW_TOKENS as readonly string[]).includes(key) &&
						isFormThemeShadow(shadow),
				))) &&
		(value.tracking === undefined ||
			(isRecord(value.tracking) &&
				Object.entries(value.tracking).every(
					([key, tracking]) =>
						(FORM_TRACKING_TOKENS as readonly string[]).includes(key) &&
						isFormThemeTracking(tracking),
				))) &&
		inRange(value.letterSpacing, -0.5, 0.5) &&
		inRange(value.radius, 0, 10) &&
		inRange(value.spacing, 0.01, 2) &&
		isFormThemeColor(value.shadow.color) &&
		inRange(value.shadow.opacity, 0, 1) &&
		inRange(value.shadow.blur, 0, 200) &&
		inRange(value.shadow.spread, -200, 200) &&
		inRange(value.shadow.x, -200, 200) &&
		inRange(value.shadow.y, -200, 200)
	);
}

export function normalizeFormTheme(theme: StoredFormTheme): FormTheme {
	if (!("colors" in theme)) {
		const { mode, light, dark, ...settings } = theme;
		return normalizeFormTheme({
			...settings,
			colors: mode === "dark" ? dark : light,
		});
	}
	const current = theme;
	return {
		...current,
		colors: { ...DEFAULT_COLORS, ...current.colors },
		fonts: {
			sans:
				current.fontFamily === "system"
					? (current.fonts?.sans ?? FORM_FONTS.system.value)
					: FORM_FONTS[current.fontFamily].value,
			serif:
				current.fonts?.serif ??
				'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
			mono: current.fonts?.mono ?? FORM_FONTS.mono.value,
		},
	};
}

export function getFormThemeShadows(
	theme: FormTheme,
): Record<(typeof FORM_SHADOW_TOKENS)[number], string> {
	const { shadow } = theme;
	const color = (factor: number) =>
		`color-mix(in srgb, ${shadow.color} ${Math.min(100, shadow.opacity * factor * 100)}%, transparent)`;
	const layer = (factor: number) =>
		`${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${color(factor)}`;
	const second = (y: number, blur: number) =>
		`${shadow.x}px ${y}px ${blur}px ${shadow.spread - 1}px ${color(1)}`;
	return {
		"shadow-2xs": layer(0.5),
		"shadow-xs": layer(0.5),
		"shadow-sm": `${layer(1)}, ${second(1, 2)}`,
		shadow: `${layer(1)}, ${second(1, 2)}`,
		"shadow-md": `${layer(1)}, ${second(2, 4)}`,
		"shadow-lg": `${layer(1)}, ${second(4, 6)}`,
		"shadow-xl": `${layer(1)}, ${second(8, 10)}`,
		"shadow-2xl": layer(2.5),
		...theme.shadows,
	};
}

export function getFormThemeFontUrls(
	theme: StoredFormTheme | undefined,
): string[] {
	if (!theme) return [];
	const fonts = Object.values(normalizeFormTheme(theme).fonts ?? {});
	const families = [
		...new Set(
			fonts.map((font) => font.split(",")[0].trim().replace(/['"]/g, "")),
		),
	].filter(
		(font) =>
			!/^(?:ui-.*|system-ui|sans-serif|serif|monospace|cursive|fantasy|Arial|Verdana|Georgia|Times New Roman|Courier New|Segoe UI|Helvetica.*|BlinkMacSystemFont|-apple-system)$/i.test(
				font,
			),
	);
	return families.map(
		(family) =>
			`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`,
	);
}

export function getFormThemeStyle(
	savedTheme: StoredFormTheme | undefined,
): CSSProperties | undefined {
	if (!savedTheme) return undefined;
	const theme = normalizeFormTheme(savedTheme);
	const { shadow } = theme;
	const variables: Record<string, string> = {};
	for (const [token, value] of Object.entries(theme.colors))
		variables[`--${token}`] = value;
	for (const [token, value] of Object.entries(getFormThemeShadows(theme)))
		variables[`--${token}`] = value;
	const offsets = {
		tighter: -0.05,
		tight: -0.025,
		wide: 0.025,
		wider: 0.05,
		widest: 0.1,
	};
	for (const token of FORM_TRACKING_TOKENS)
		variables[`--tracking-${token}`] =
			theme.tracking?.[token] ??
			`calc(var(--tracking-normal) ${offsets[token] < 0 ? "-" : "+"} ${Math.abs(offsets[token])}em)`;
	return {
		...variables,
		"--shadow-x": `${shadow.x}px`,
		"--shadow-y": `${shadow.y}px`,
		"--shadow-blur": `${shadow.blur}px`,
		"--shadow-spread": `${shadow.spread}px`,
		"--shadow-opacity": String(shadow.opacity),
		"--shadow-color": shadow.color,
		"--radius": `${theme.radius}rem`,
		"--spacing": `${theme.spacing}rem`,
		"--font-sans": theme.fonts?.sans,
		"--font-serif": theme.fonts?.serif,
		"--font-mono": theme.fonts?.mono,
		"--tracking-normal": `${theme.letterSpacing}em`,
		fontFamily: theme.fonts?.sans,
		letterSpacing: `${theme.letterSpacing}em`,
		colorScheme: "dark",
		backgroundColor: theme.colors.background,
		color: theme.colors.foreground,
	} as CSSProperties;
}

export function exportFormThemeCss(theme: FormTheme): string {
	const declarations = Object.entries(getFormThemeStyle(theme) ?? {})
		.filter(([key]) => key.startsWith("--"))
		.map(([key, value]) => `  ${key}: ${value};`)
		.join("\n");
	return `:root {\n${declarations}\n}`;
}

function themeLength(value: string, unit: "rem" | "em" | "px"): number {
	const match = value.match(/^([+-]?(?:\d*\.)?\d+)(rem|em|px)?$/);
	if (!match)
		throw new Error(`Unsupported length: ${value}. Use px, rem or em.`);
	const number = Number(match[1]);
	const from = match[2] ?? unit;
	return from === unit || (from !== "px" && unit !== "px")
		? number
		: unit === "px"
			? number * 16
			: number / 16;
}

function normalizeHslFunctions(value: string): string {
	// Some community exports mix legacy commas with modern slash opacity.
	return value.replace(
		/(hsla?)\(([^()]+)\)/gi,
		(match, name: string, channels: string) =>
			channels.includes(",") && channels.includes("/")
				? `${name}(${channels.replace(/,\s*/g, " ")})`
				: match,
	);
}

function normalizeImportedColor(value: string): string {
	// Tailwind 3 and some community shadow settings contain bare HSL channels.
	if (
		/^[+-]?[\d.]+(?:deg)?(?:\s*,\s*|\s+)[\d.]+%?(?:\s*,\s*|\s+)[\d.]+%?(?:\s*\/\s*[\d.]+%?)?$/.test(
			value,
		)
	)
		value = `hsl(${value.replace(/,\s*/g, " ")})`;
	return normalizeHslFunctions(value);
}

/** Shared by CSS exports, shadcn registry JSON and the community preset picker. */
export function importFormThemeVariables(
	variables: Record<string, unknown>,
	current: FormTheme,
): FormTheme {
	const next = structuredClone(normalizeFormTheme(current));
	const raw: Record<string, unknown> = {};
	for (const [name, value] of Object.entries(variables))
		raw[name.replace(/^--/, "")] = value;
	let imported = 0;
	const resolve = (
		value: string,
		font: boolean,
		seen = new Set<string>(),
	): string =>
		value.replace(
			/var\(\s*--([\w-]+)\s*(?:,\s*([^()]+))?\)/g,
			(_, name: string, fallback: string | undefined) => {
				if (seen.has(name) || seen.size > 20)
					throw new Error(`Circular CSS variable: --${name}`);
				const target = raw[name] ?? fallback;
				if (typeof target !== "string") {
					if (font) return "";
					throw new Error(`Missing CSS variable: --${name}`);
				}
				return resolve(target, font, new Set([...seen, name]));
			},
		);
	const read = (name: string, font = false): string | undefined => {
		if (raw[name] === undefined) return undefined;
		if (typeof raw[name] !== "string")
			throw new Error(`Invalid value for --${name}.`);
		imported++;
		const value = resolve(raw[name].trim(), font);
		if (value.includes("var("))
			throw new Error(`Unresolved CSS variable in --${name}.`);
		return value;
	};
	for (const group of FORM_COLOR_GROUPS)
		for (const token of group.tokens) {
			let color = read(token);
			if (color === undefined) continue;
			color = normalizeImportedColor(color);
			if (!isFormThemeColor(color))
				throw new Error(`Invalid color for --${token}.`);
			next.colors[token] = color;
		}
	for (const slot of ["sans", "serif", "mono"] as const) {
		let value = read(`font-${slot}`, true)
			?.replace(/^\s*,\s*|\s*,\s*$/g, "")
			.replace(/,\s*,/g, ",")
			.trim();
		if (value === undefined || value === "") continue;
		if (!isFormThemeFont(value))
			throw new Error(`Invalid font stack for --font-${slot}.`);
		// CSS requires quotes around family names containing a numeric word.
		value = value
			.split(",")
			.map((family) => {
				const name = family.trim();
				return !/^["']/.test(name) && /(?:^|\s)\d/.test(name)
					? `"${name}"`
					: name;
			})
			.join(", ");
		next.fonts = {
			...(normalizeFormTheme(next).fonts as NonNullable<FormTheme["fonts"]>),
			[slot]: value,
		};
		if (slot === "sans") next.fontFamily = "system";
	}
	for (const key of ["radius", "spacing"] as const) {
		const value = read(key);
		if (value !== undefined) next[key] = themeLength(value, "rem");
	}
	const letterSpacing = read("letter-spacing") ?? read("tracking-normal");
	if (letterSpacing !== undefined)
		next.letterSpacing = themeLength(letterSpacing, "em");
	let shadowChanged = false;
	for (const key of ["blur", "spread", "x", "y"] as const) {
		const value =
			read(`shadow-${key}`) ??
			(key === "x" || key === "y" ? read(`shadow-offset-${key}`) : undefined);
		if (value === undefined) continue;
		next.shadow[key] = themeLength(value, "px");
		shadowChanged = true;
	}
	const opacity = read("shadow-opacity");
	if (opacity !== undefined) {
		if (!/^(?:\d*\.)?\d+%?$/.test(opacity))
			throw new Error("Invalid shadow opacity.");
		next.shadow.opacity =
			Number.parseFloat(opacity) / (opacity.endsWith("%") ? 100 : 1);
		shadowChanged = true;
	}
	const rawShadowColor = read("shadow-color");
	const shadowColor =
		rawShadowColor === undefined
			? undefined
			: normalizeImportedColor(rawShadowColor);
	if (shadowColor !== undefined) {
		if (!isFormThemeColor(shadowColor))
			throw new Error("Invalid shadow color.");
		next.shadow.color = shadowColor;
		shadowChanged = true;
	}
	if (shadowChanged) delete next.shadows;
	for (const token of FORM_SHADOW_TOKENS) {
		const rawValue = read(token);
		if (rawValue === undefined) continue;
		const value = normalizeHslFunctions(rawValue);
		if (!isFormThemeShadow(value))
			throw new Error(`Invalid shadow for --${token}.`);
		next.shadows = { ...next.shadows, [token]: value };
	}
	for (const token of FORM_TRACKING_TOKENS) {
		const value = raw[`tracking-${token}`];
		if (value === undefined) continue;
		if (!isFormThemeTracking(value))
			throw new Error(`Invalid value for --tracking-${token}.`);
		next.tracking = { ...next.tracking, [token]: value };
		imported++;
	}
	if (!imported)
		throw new Error(
			"Paste CSS or registry JSON containing tweakcn theme variables.",
		);
	if (!isFormTheme(next))
		throw new Error("The theme contains values outside the supported range.");
	return normalizeFormTheme(next);
}

/** Import theme tokens only; global selectors and application CSS stay outside the form. */
export function importFormThemeCss(css: string, current: FormTheme): FormTheme {
	if (css.length > 1_000_000) throw new Error("The theme file is too large.");
	const content = css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
	if (content.startsWith("{")) {
		let data: unknown;
		try {
			data = JSON.parse(content);
		} catch {
			throw new Error("The registry JSON is invalid.");
		}
		if (!isRecord(data)) throw new Error("Expected a tweakcn registry item.");
		const source = isRecord(data.cssVars)
			? data.cssVars
			: isRecord(data.styles)
				? data.styles
				: data;
		const variables = {
			...(isRecord(source.theme) ? source.theme : {}),
			...(isRecord(source.light) ? source.light : {}),
			...(isRecord(source.dark) ? source.dark : {}),
		};
		return importFormThemeVariables(variables, current);
	}
	const variables: Record<string, string> = {};
	for (const selector of [/:root\s*\{([^{}]*)\}/g, /\.dark\s*\{([^{}]*)\}/g]) {
		for (const block of content.matchAll(selector)) {
			for (const declaration of block[1].matchAll(
				/--([\w-]+)\s*:\s*([^;{}]+)(?:;|$)/g,
			))
				variables[declaration[1]] = declaration[2].trim();
		}
	}
	return importFormThemeVariables(variables, current);
}

export function getTweakcnRegistryUrl(input: string): string {
	let url: URL;
	try {
		url = new URL(input.trim());
	} catch {
		throw new Error("Paste a theme link from tweakcn.com.");
	}
	if (
		url.protocol !== "https:" ||
		!["tweakcn.com", "www.tweakcn.com"].includes(url.hostname) ||
		url.username ||
		url.password ||
		url.port
	)
		throw new Error("Use an HTTPS theme link from tweakcn.com.");
	const id =
		url.pathname
			.match(/^\/(?:r\/)?themes\/([^/]+)\/?$/)?.[1]
			?.replace(/\.json$/, "") ??
		(url.pathname === "/editor/theme" ? url.searchParams.get("theme") : null);
	if (!id || !/^[\w-]+$/.test(id))
		throw new Error(
			"Open a community theme and copy its theme or registry link.",
		);
	return `https://tweakcn.com/r/themes/${id}`;
}
