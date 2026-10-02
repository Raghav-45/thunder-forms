import {
	CheckIcon,
	CodeIcon,
	CopyIcon,
	Loader2Icon,
	PaletteIcon,
	RotateCcwIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Slider } from "#/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { ThemePresetPicker } from "#/containers/dashboard/builder/[slug]/components/theme-preset-picker";
import { FormThemeScope } from "#/features/form-builder/components/form-theme-scope";
import type { FieldConfig } from "#/features/form-builder/elements";
import type { FormStructure } from "#/features/form-builder/form-structure";
import {
	createFormTheme,
	exportFormThemeCss,
	FORM_COLOR_GROUPS,
	FORM_FONTS,
	FORM_SHADOW_TOKENS,
	FORM_TRACKING_TOKENS,
	type FormColorToken,
	type FormTheme,
	getFormThemeShadows,
	getFormThemeStyle,
	getTweakcnRegistryUrl,
	importFormThemeCss,
	isFormThemeColor,
	isFormThemeFont,
	isFormThemeShadow,
	isFormThemeTracking,
	normalizeFormTheme,
} from "#/features/form-builder/theme";
import {
	createDefaultFieldConfig,
	getFieldComponent,
} from "#/features/form-builder/utils/helperFunctions";
import { cn } from "#/lib/utils";

function ColorControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const id = useId();
	const [text, setText] = useState(value);
	const [invalid, setInvalid] = useState(false);
	useEffect(() => {
		setText(value);
		setInvalid(false);
	}, [value]);
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={id}>{label}</Label>
			<div className="flex items-center gap-2">
				<div
					className="relative size-9 shrink-0 overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-ring"
					style={{ backgroundColor: value }}
				>
					<input
						type="color"
						aria-label={`Pick ${label.toLowerCase()} color`}
						value={/^#[\da-f]{6}$/i.test(value) ? value : "#000000"}
						onChange={(event) => onChange(event.target.value)}
						className="absolute inset-0 size-full cursor-pointer opacity-0"
					/>
				</div>
				<Input
					id={id}
					value={text}
					aria-invalid={invalid}
					aria-describedby={invalid ? `${id}-error` : undefined}
					placeholder="HEX, RGB, HSL or OKLCH"
					onChange={(event) => {
						const color = event.target.value;
						setText(color);
						const valid =
							isFormThemeColor(color) && CSS.supports("color", color);
						setInvalid(!valid);
						if (valid) onChange(color);
					}}
				/>
			</div>
			{invalid ? (
				<p id={`${id}-error`} className="text-xs text-destructive">
					Enter a valid CSS color.
				</p>
			) : null}
		</div>
	);
}

function RangeControl({
	label,
	value,
	min,
	max,
	step = 1,
	unit = "",
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	unit?: string;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<Label htmlFor={id}>{label}</Label>
				<span className="text-xs tabular-nums text-muted-foreground">
					{Number(value.toFixed(3))}
					{unit}
				</span>
			</div>
			<Slider
				id={id}
				aria-label={label}
				ref={(root) =>
					root
						?.querySelector('[role="slider"]')
						?.setAttribute("aria-label", label)
				}
				value={[value]}
				min={min}
				max={max}
				step={step}
				onValueChange={([next]) => onChange(next)}
			/>
		</div>
	);
}

function TextControl({
	label,
	value,
	onChange,
	validate,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	validate: (value: string) => boolean;
}) {
	const id = useId();
	const [text, setText] = useState(value);
	const [invalid, setInvalid] = useState(false);
	useEffect(() => {
		setText(value);
		setInvalid(false);
	}, [value]);
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				value={text}
				aria-invalid={invalid}
				aria-describedby={invalid ? `${id}-error` : undefined}
				onChange={(event) => {
					const next = event.target.value;
					setText(next);
					const valid = validate(next);
					setInvalid(!valid);
					if (valid) onChange(next);
				}}
			/>
			{invalid ? (
				<p id={`${id}-error`} className="text-xs text-destructive">
					Enter a valid CSS value.
				</p>
			) : null}
		</div>
	);
}

interface FormCustomizationProps {
	structure: FormStructure;
	activePageId: string;
	title: string;
	description?: string;
	submitButtonText?: string;
	onUpdate: (theme: FormTheme | undefined) => void;
}

export function FormCustomization(props: FormCustomizationProps) {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					<PaletteIcon data-icon="inline-start" />
					Customize
				</Button>
			</DialogTrigger>
			<DialogContent className="flex h-[92dvh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1200px,calc(100%-3rem))]">
				{open ? (
					<CustomizationEditor {...props} onClose={() => setOpen(false)} />
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function CustomizationEditor({
	structure,
	activePageId,
	title,
	description,
	submitButtonText,
	onUpdate,
	onClose,
}: FormCustomizationProps & { onClose: () => void }) {
	const [draft, setDraft] = useState(() =>
		structure.theme
			? structuredClone(normalizeFormTheme(structure.theme))
			: createFormTheme(),
	);
	const [colorSearch, setColorSearch] = useState("");
	const [mobileView, setMobileView] = useState("controls");
	const previewId = useId();
	const [css, setCss] = useState("");
	const [cssError, setCssError] = useState("");
	const [themeUrl, setThemeUrl] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const [previewPageId, setPreviewPageId] = useState(activePageId);
	const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
	const [sampleFields] = useState(() => [
		createDefaultFieldConfig("text-input"),
		createDefaultFieldConfig("text-area"),
		createDefaultFieldConfig("checkbox"),
	]);
	const previewPage =
		structure.pages.find((page) => page.id === previewPageId) ??
		structure.pages[0];
	const hasFields = structure.pages.some((page) =>
		page.sections.some((section) => section.fields.length > 0),
	);
	const sections = hasFields
		? previewPage.sections
		: [{ id: "sample", title: "Your details", fields: sampleFields }];
	const updateColor = (token: FormColorToken, value: string) =>
		setDraft((current) => ({
			...current,
			colors: { ...current.colors, [token]: value },
		}));
	const updateShadow = (
		key: keyof FormTheme["shadow"],
		value: string | number,
	) =>
		setDraft((current) => ({
			...current,
			shadow: { ...current.shadow, [key]: value },
			shadows: undefined,
		}));
	const importTheme = (content: string) => {
		try {
			setDraft(importFormThemeCss(content, draft));
			setCssError("");
			toast.success("Theme imported");
		} catch (error) {
			setCssError(
				error instanceof Error ? error.message : "Could not import theme",
			);
		}
	};
	const renderField = (field: FieldConfig) => {
		const Component = getFieldComponent(field.uniqueIdentifier);
		return (
			<Component
				key={field.id}
				field={
					{
						...field,
						id: `${previewId}-${field.id}`,
						disabled:
							field.disabled || field.uniqueIdentifier === "file-upload",
					} as never
				}
				value={previewData[field.id]}
				onChange={(value) =>
					setPreviewData((current) => ({ ...current, [field.id]: value }))
				}
			/>
		);
	};

	return (
		<>
			<DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
				<DialogTitle>Customize your form</DialogTitle>
				<DialogDescription>
					Make it yours. Preview every change as you go.
				</DialogDescription>
			</DialogHeader>
			<Tabs
				value={mobileView}
				onValueChange={setMobileView}
				className="shrink-0 border-b px-5 py-2 md:hidden"
			>
				<TabsList className="w-full" aria-label="Customization view">
					<TabsTrigger value="controls">Controls</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>
			</Tabs>
			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[320px_minmax(0,1fr)] md:overflow-hidden">
				<div
					className={cn(
						"min-h-0 flex-col gap-5 border-b p-5 md:flex md:overflow-y-auto md:border-r md:border-b-0",
						mobileView === "controls" ? "flex" : "hidden",
					)}
				>
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-theme-preset">Theme preset</Label>
						<ThemePresetPicker onSelect={setDraft} />
					</div>
					<Tabs defaultValue="colors" className="gap-5">
						<TabsList className="w-full" aria-label="Customization controls">
							<TabsTrigger value="colors">Colors</TabsTrigger>
							<TabsTrigger value="typography">Typography</TabsTrigger>
							<TabsTrigger value="other">Other</TabsTrigger>
						</TabsList>
						<TabsContent value="colors" className="flex flex-col gap-5">
							<Input
								aria-label="Search colors"
								placeholder="Search colors..."
								value={colorSearch}
								onChange={(event) => setColorSearch(event.target.value)}
							/>
							{FORM_COLOR_GROUPS.filter((group) =>
								`${group.label} ${group.tokens.join(" ")}`
									.toLowerCase()
									.includes(colorSearch.toLowerCase()),
							).map((group) => (
								<fieldset key={group.label} className="flex flex-col gap-3">
									<legend className="mb-3 text-sm font-semibold">
										{group.label}
									</legend>
									{group.tokens.map((token, index) => (
										<ColorControl
											key={token}
											label={
												token.startsWith("chart-")
													? `Chart ${token.slice(-1)}`
													: token.endsWith("ring")
														? "Focus ring"
														: token.endsWith("border")
															? "Border"
															: token === "input"
																? "Input"
																: index === 0
																	? "Background"
																	: "Foreground"
											}
											value={draft.colors[token] ?? "#000000"}
											onChange={(value) => updateColor(token, value)}
										/>
									))}
									<Separator className="mt-2" />
								</fieldset>
							))}
							{!FORM_COLOR_GROUPS.some((group) =>
								`${group.label} ${group.tokens.join(" ")}`
									.toLowerCase()
									.includes(colorSearch.toLowerCase()),
							) ? (
								<p className="text-sm text-muted-foreground">
									No matching colors.
								</p>
							) : null}
						</TabsContent>
						<TabsContent value="typography" className="flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<Label htmlFor="form-theme-font">Font family</Label>
								<Select
									value={
										draft.fontFamily === "system" &&
										draft.fonts?.sans !== FORM_FONTS.system.value
											? "custom"
											: draft.fontFamily
									}
									onValueChange={(fontFamily) =>
										fontFamily !== "custom" &&
										setDraft((current) => ({
											...current,
											fontFamily: fontFamily as FormTheme["fontFamily"],
											fonts: {
												...(normalizeFormTheme(current).fonts as NonNullable<
													FormTheme["fonts"]
												>),
												sans: FORM_FONTS[fontFamily as FormTheme["fontFamily"]]
													.value,
											},
										}))
									}
								>
									<SelectTrigger id="form-theme-font" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="custom">
												Imported / custom font
											</SelectItem>
											{Object.entries(FORM_FONTS).map(([id, font]) => (
												<SelectItem key={id} value={id}>
													<span style={{ fontFamily: font.value }}>
														{font.label}
													</span>
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
							{(["sans", "serif", "mono"] as const).map((slot) => (
								<TextControl
									key={slot}
									label={
										slot === "sans"
											? "Primary font stack"
											: slot === "serif"
												? "Serif font stack"
												: "Monospace font stack"
									}
									value={draft.fonts?.[slot] ?? ""}
									validate={(value) =>
										isFormThemeFont(value) && CSS.supports("font-family", value)
									}
									onChange={(value) =>
										setDraft((current) => ({
											...current,
											fontFamily:
												slot === "sans" ? "system" : current.fontFamily,
											fonts: {
												...(normalizeFormTheme(current).fonts as NonNullable<
													FormTheme["fonts"]
												>),
												[slot]: value,
											},
										}))
									}
								/>
							))}
							<p className="text-xs text-muted-foreground">
								Google Fonts load automatically. Other fonts use your fallback
								stack.
							</p>
							<RangeControl
								label="Letter spacing"
								value={draft.letterSpacing}
								min={-0.5}
								max={0.5}
								step={0.005}
								unit="em"
								onChange={(letterSpacing) =>
									setDraft((current) => ({ ...current, letterSpacing }))
								}
							/>
							<details>
								<summary className="cursor-pointer text-sm font-medium">
									Tracking scale
								</summary>
								<div className="mt-3 flex flex-col gap-3">
									{FORM_TRACKING_TOKENS.map((token) => (
										<TextControl
											key={token}
											label={`Tracking ${token}`}
											value={
												draft.tracking?.[token] ??
												String(
													(getFormThemeStyle(draft) as Record<string, string>)[
														`--tracking-${token}`
													],
												)
											}
											validate={isFormThemeTracking}
											onChange={(value) =>
												setDraft((current) => ({
													...current,
													tracking: { ...current.tracking, [token]: value },
												}))
											}
										/>
									))}
								</div>
							</details>
						</TabsContent>
						<TabsContent value="other" className="flex flex-col gap-6">
							<RangeControl
								label="Corner radius"
								value={draft.radius}
								min={0}
								max={10}
								step={0.05}
								unit="rem"
								onChange={(radius) =>
									setDraft((current) => ({ ...current, radius }))
								}
							/>
							<RangeControl
								label="Spacing"
								value={draft.spacing}
								min={0.01}
								max={2}
								step={0.01}
								unit="rem"
								onChange={(spacing) =>
									setDraft((current) => ({ ...current, spacing }))
								}
							/>
							<Separator />
							<h3 className="text-sm font-semibold">Shadow</h3>
							<ColorControl
								label="Shadow color"
								value={draft.shadow.color}
								onChange={(value) => updateShadow("color", value)}
							/>
							<RangeControl
								label="Opacity"
								value={draft.shadow.opacity}
								min={0}
								max={1}
								step={0.01}
								onChange={(value) => updateShadow("opacity", value)}
							/>
							<RangeControl
								label="Blur"
								value={draft.shadow.blur}
								min={0}
								max={200}
								unit="px"
								onChange={(value) => updateShadow("blur", value)}
							/>
							<RangeControl
								label="Spread"
								value={draft.shadow.spread}
								min={-200}
								max={200}
								unit="px"
								onChange={(value) => updateShadow("spread", value)}
							/>
							<RangeControl
								label="Horizontal offset"
								value={draft.shadow.x}
								min={-200}
								max={200}
								unit="px"
								onChange={(value) => updateShadow("x", value)}
							/>
							<RangeControl
								label="Vertical offset"
								value={draft.shadow.y}
								min={-200}
								max={200}
								unit="px"
								onChange={(value) => updateShadow("y", value)}
							/>
							<details>
								<summary className="cursor-pointer text-sm font-medium">
									Shadow scale
								</summary>
								<div className="mt-3 flex flex-col gap-3">
									{FORM_SHADOW_TOKENS.map((token) => (
										<TextControl
											key={token}
											label={
												token === "shadow"
													? "Default shadow"
													: token.replace("shadow-", "Shadow ")
											}
											value={getFormThemeShadows(draft)[token]}
											validate={(value) =>
												isFormThemeShadow(value) &&
												CSS.supports("box-shadow", value)
											}
											onChange={(value) =>
												setDraft((current) => ({
													...current,
													shadows: { ...current.shadows, [token]: value },
												}))
											}
										/>
									))}
								</div>
							</details>
						</TabsContent>
					</Tabs>
					<Separator />
					<details className="flex flex-col gap-3">
						<summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
							<CodeIcon className="size-4" />
							Import or export CSS
						</summary>
						<div className="mt-3 flex flex-col gap-3">
							<Label htmlFor="form-theme-css">Theme CSS</Label>
							<Textarea
								id="form-theme-css"
								value={css}
								aria-invalid={Boolean(cssError)}
								aria-describedby={cssError ? "form-theme-css-error" : undefined}
								onChange={(event) => {
									setCss(event.target.value);
									setCssError("");
								}}
								placeholder="Paste tweakcn CSS or shadcn registry JSON"
								className="max-h-64 min-h-32"
							/>
							{cssError ? (
								<p
									id="form-theme-css-error"
									role="alert"
									className="text-xs text-destructive"
								>
									{cssError}
								</p>
							) : null}
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isImporting}
									onClick={() => importTheme(css)}
								>
									Import theme
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={async () => {
										const exported = exportFormThemeCss(draft);
										setCss(exported);
										try {
											await navigator.clipboard.writeText(exported);
											toast.success("Theme CSS copied");
										} catch {
											toast.message("Select the CSS above to copy it.");
										}
									}}
								>
									<CopyIcon data-icon="inline-start" />
									Copy CSS
								</Button>
							</div>
							<Label htmlFor="form-theme-file">Import a CSS or JSON file</Label>
							<Input
								id="form-theme-file"
								type="file"
								accept=".css,.json,text/css,application/json"
								disabled={isImporting}
								onChange={async (event) => {
									const file = event.target.files?.[0];
									if (!file) return;
									if (file.size > 1_000_000) {
										setCssError("The theme file is too large.");
										return;
									}
									const content = await file.text();
									setCss(content);
									importTheme(content);
								}}
							/>
							<Separator />
							<Label htmlFor="form-theme-url">tweakcn theme link</Label>
							<Input
								id="form-theme-url"
								type="url"
								placeholder="https://tweakcn.com/themes/..."
								value={themeUrl}
								onChange={(event) => setThemeUrl(event.target.value)}
							/>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isImporting || !themeUrl.trim()}
								onClick={async () => {
									setIsImporting(true);
									setCssError("");
									try {
										const response = await fetch(
											getTweakcnRegistryUrl(themeUrl),
											{
												signal: AbortSignal.timeout(15_000),
												credentials: "omit",
											},
										);
										if (!response.ok)
											throw new Error(
												"Could not load this theme. Check that its tweakcn link is public.",
											);
										const content = await response.text();
										setDraft(importFormThemeCss(content, draft));
										setCss(content);
										toast.success("Theme imported");
									} catch (error) {
										setCssError(
											error instanceof Error
												? error.message
												: "Could not import theme",
										);
									} finally {
										setIsImporting(false);
									}
								}}
							>
								{isImporting ? (
									<Loader2Icon
										data-icon="inline-start"
										className="animate-spin"
									/>
								) : null}
								{isImporting ? "Importing..." : "Import from link"}
							</Button>
						</div>
					</details>
				</div>
				<div
					className={cn(
						"min-w-0 flex-col md:flex md:min-h-0",
						mobileView === "preview" ? "flex" : "hidden",
					)}
				>
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
						<p className="text-sm font-medium">Live preview</p>
						{structure.pages.length > 1 ? (
							<Select value={previewPage.id} onValueChange={setPreviewPageId}>
								<SelectTrigger aria-label="Preview page">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{structure.pages.map((page, index) => (
											<SelectItem key={page.id} value={page.id}>
												{page.title || `Page ${index + 1}`}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						) : (
							<span className="text-xs text-muted-foreground">
								{hasFields ? "Your form" : "Sample form"}
							</span>
						)}
					</div>
					<div className="min-h-80 flex-1 overflow-y-auto">
						<FormThemeScope
							theme={draft}
							className="min-h-full p-5 sm:p-8"
							data-testid="customization-preview"
						>
							<div className="mx-auto flex max-w-2xl flex-col gap-6">
								<header className="flex flex-col gap-3">
									<h2 className="text-2xl font-bold md:text-4xl">{title}</h2>
									{description ? (
										<p className="text-muted-foreground">{description}</p>
									) : null}
								</header>
								{sections.map((section, index) => (
									<section
										key={section.id}
										className="flex min-w-0 flex-col gap-5 border bg-card p-4 sm:p-6"
									>
										<div className="flex flex-col gap-1 border-b pb-4">
											<h3 className="text-base font-semibold">
												{section.title || `Section ${index + 1}`}
											</h3>
											{"description" in section && section.description ? (
												<p className="text-sm text-muted-foreground">
													{section.description}
												</p>
											) : null}
										</div>
										{section.fields.map(renderField)}
										{section.fields.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												Add fields in the builder to preview them here.
											</p>
										) : null}
									</section>
								))}
								<div>
									<Button
										type="button"
										onClick={() =>
											toast.message(
												"This is a preview. Your answers are not submitted.",
											)
										}
									>
										{submitButtonText || "Submit"}
									</Button>
								</div>
							</div>
						</FormThemeScope>
					</div>
				</div>
			</div>
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!structure.theme}
					onClick={() => {
						onUpdate(undefined);
						onClose();
					}}
				>
					<RotateCcwIcon data-icon="inline-start" />
					Reset to original
				</Button>
				<div className="flex items-center gap-2">
					<DialogClose asChild>
						<Button type="button" variant="outline" size="sm">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						size="sm"
						disabled={isImporting}
						onClick={() => {
							onUpdate(draft);
							onClose();
							toast.success(
								"Customization applied. Save your form to keep it.",
							);
						}}
					>
						<CheckIcon data-icon="inline-start" />
						Apply changes
					</Button>
				</div>
			</div>
		</>
	);
}
