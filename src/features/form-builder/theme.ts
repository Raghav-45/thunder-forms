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

export const FORM_THEME_PRESETS = [
	{
		id: "thunder",
		label: "Thunder",
		primary: "#f4ce4c",
		foreground: "#171717",
	},
	{
		id: "neutral",
		label: "Neutral",
		primary: "#fafafa",
		foreground: "#171717",
	},
	{
		id: "ocean",
		label: "Ocean",
		primary: "#60a5fa",
		foreground: "#171717",
	},
	{
		id: "rose",
		label: "Rose",
		primary: "#fb7185",
		foreground: "#171717",
	},
	{
		id: "forest",
		label: "Forest",
		primary: "#4ade80",
		foreground: "#171717",
	},
	{
		id: "violet",
		label: "Violet",
		primary: "#a78bfa",
		foreground: "#171717",
	},
] as const;

export function createFormTheme(presetId = "thunder"): FormTheme {
	const preset =
		FORM_THEME_PRESETS.find((candidate) => candidate.id === presetId) ??
		FORM_THEME_PRESETS[0];
	return {
		colors: {
			...DEFAULT_COLORS,
			primary: preset.primary,
			"primary-foreground": preset.foreground,
			ring: preset.primary,
		},
		fontFamily: "system",
		fonts: {
			sans: FORM_FONTS.system.value,
			serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
			mono: FORM_FONTS.mono.value,
		},
		letterSpacing: 0,
		radius: 0.75,
		spacing: 0.25,
		shadow: { color: "#000000", opacity: 0.1, blur: 8, spread: 0, x: 0, y: 2 },
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
