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
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
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
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { ThemePresetPicker } from "#/containers/dashboard/builder/[slug]/components/theme-preset-picker";
import {
	THEME_COLOR_GROUP_DETAILS,
	THEME_COLOR_LABELS,
} from "#/containers/dashboard/builder/[slug]/constants/theme-color-labels";
import {
	BASIC_THEME_COLOR_GROUPS,
	THEME_FONT_LABELS,
} from "#/containers/dashboard/builder/[slug]/constants/theme-customization";
import { FormThemeScope } from "#/features/form-builder/components/form-theme-scope";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	type FormLayout,
	type FormStructure,
	type NormalizedFormLayout,
	normalizeFormLayout,
} from "#/features/form-builder/form-structure";
import {
	createFormTheme,
	exportFormThemeCss,
	FORM_COLOR_GROUPS,
	FORM_FONTS,
	type FormColorToken,
	type FormTheme,
	getTweakcnRegistryUrl,
	importFormThemeCss,
	isFormThemeColor,
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
	showCode = true,
	onChange,
}: {
	label: string;
	value: string;
	showCode?: boolean;
	onChange: (value: string) => void;
}) {
	const id = useId();
	const [text, setText] = useState(value);
	const [invalid, setInvalid] = useState(false);
	const [pickerValue, setPickerValue] = useState("#000000");
	useEffect(() => {
		setText(value);
		setInvalid(false);
		// Native color pickers need hex; keep the imported CSS value unchanged.
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const context = canvas.getContext("2d");
		if (context) {
			context.fillStyle = value;
			context.fillRect(0, 0, 1, 1);
			const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
			setPickerValue(
				`#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`,
			);
		}
	}, [value]);
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-3">
				<Label htmlFor={id} className="cursor-pointer">
					{label}
				</Label>
				<div
					className="relative size-9 shrink-0 overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-ring"
					style={{ backgroundColor: value }}
				>
					<input
						id={id}
						type="color"
						aria-label={`Choose ${label.toLowerCase()}`}
						value={pickerValue}
						onChange={(event) => onChange(event.target.value)}
						className="absolute inset-0 size-full cursor-pointer opacity-0"
					/>
				</div>
			</div>
			{showCode ? (
				<Input
					aria-label={`${label} code`}
					value={text}
					aria-invalid={invalid}
					aria-describedby={invalid ? `${id}-error` : undefined}
					placeholder="Color code, e.g. #ffae00"
					onChange={(event) => {
						const color = event.target.value;
						setText(color);
						const valid =
							isFormThemeColor(color) && CSS.supports("color", color);
						setInvalid(!valid);
						if (valid) onChange(color);
					}}
				/>
			) : null}
			{showCode && invalid ? (
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
	displayValue,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	unit?: string;
	displayValue?: string;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<Label htmlFor={id}>{label}</Label>
				<span className="text-xs tabular-nums text-muted-foreground">
					{displayValue ?? `${Number(value.toFixed(3))}${unit}`}
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

interface FormCustomizationProps {
	structure: FormStructure;
	activePageId: string;
	title: string;
	description?: string;
	submitButtonText?: string;
	onUpdate: (
		theme: FormTheme | undefined,
		layout: FormLayout | undefined,
	) => void;
}

function FontControl({
	theme,
	onChange,
}: {
	theme: FormTheme;
	onChange: (fontFamily: FormTheme["fontFamily"]) => void;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={id}>Text font</Label>
			<Select
				value={
					theme.fontFamily === "system" &&
					theme.fonts?.sans !== FORM_FONTS.system.value
						? "custom"
						: theme.fontFamily
				}
				onValueChange={(value) =>
					value !== "custom" && onChange(value as FormTheme["fontFamily"])
				}
			>
				<SelectTrigger id={id} className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="custom">Theme font</SelectItem>
						{Object.entries(FORM_FONTS).map(([key, font]) => (
							<SelectItem key={key} value={key}>
								<span style={{ fontFamily: font.value }}>
									{THEME_FONT_LABELS[key as FormTheme["fontFamily"]]}
								</span>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}

function LayoutControls({
	layout,
	theme,
	onChange,
	onThemeChange,
}: {
	layout: NormalizedFormLayout;
	theme: FormTheme;
	onChange: (layout: NormalizedFormLayout) => void;
	onThemeChange: (theme: FormTheme) => void;
}) {
	const updateSpacing = (
		key: keyof NormalizedFormLayout["spacing"],
		value: number,
	) =>
		onChange({
			...layout,
			spacing: { ...layout.spacing, [key]: value },
		});
	const spacingValue = (value: number) =>
		`${Number((theme.spacing * value * 16).toFixed(1))}px`;
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="text-sm font-semibold">Form heading</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					Choose where the form title and description sit.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="form-header-alignment">Title & description</Label>
				<Select
					value={layout.headerAlignment}
					onValueChange={(headerAlignment) =>
						onChange({
							...layout,
							headerAlignment:
								headerAlignment as Required<FormLayout>["headerAlignment"],
						})
					}
				>
					<SelectTrigger id="form-header-alignment">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="left">Left aligned</SelectItem>
						<SelectItem value="center">Centered</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Separator />
			<div>
				<h3 className="text-sm font-semibold">Form space</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					Choose where the form sits and how spacious it feels.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="form-content-width">Form width</Label>
				<Select
					value={layout.contentWidth}
					onValueChange={(contentWidth) =>
						onChange({
							...layout,
							contentWidth:
								contentWidth as Required<FormLayout>["contentWidth"],
						})
					}
				>
					<SelectTrigger id="form-content-width">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="compact">Compact</SelectItem>
						<SelectItem value="standard">Standard</SelectItem>
						<SelectItem value="wide">Wide</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="form-content-alignment">Form position</Label>
				<Select
					value={layout.contentAlignment}
					onValueChange={(contentAlignment) =>
						onChange({
							...layout,
							contentAlignment:
								contentAlignment as Required<FormLayout>["contentAlignment"],
						})
					}
				>
					<SelectTrigger id="form-content-alignment">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="left">Left aligned</SelectItem>
						<SelectItem value="center">Centered</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="form-section-spacing">
					Space inside question cards
				</Label>
				<Select
					value={layout.sectionSpacing}
					onValueChange={(sectionSpacing) =>
						onChange({
							...layout,
							sectionSpacing:
								sectionSpacing as Required<FormLayout>["sectionSpacing"],
						})
					}
				>
					<SelectTrigger id="form-section-spacing">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="compact">Compact</SelectItem>
						<SelectItem value="comfortable">Comfortable</SelectItem>
						<SelectItem value="spacious">Spacious</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<RangeControl
				label="Corner rounding"
				value={theme.radius}
				min={0}
				max={10}
				step={0.05}
				displayValue={
					theme.radius === 0
						? "Square"
						: `${Number((theme.radius * 16).toFixed(1))}px`
				}
				onChange={(radius) => onThemeChange({ ...theme, radius })}
			/>
			<Accordion type="multiple" defaultValue={["questions"]}>
				<AccordionItem value="heading">
					<AccordionTrigger>Heading spacing</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-5">
						<p className="text-xs text-muted-foreground">
							Adjust the form heading without affecting question spacing.
						</p>
						<RangeControl
							label="Title & description"
							value={layout.spacing.titleDescriptionGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.titleDescriptionGap)}
							onChange={(value) => updateSpacing("titleDescriptionGap", value)}
						/>
						<RangeControl
							label="Heading & first section"
							value={layout.spacing.titleContentGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.titleContentGap)}
							onChange={(value) => updateSpacing("titleContentGap", value)}
						/>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="questions">
					<AccordionTrigger>Questions & submit button</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-5">
						<p className="text-xs text-muted-foreground">
							Set the rhythm inside and between each part of the form.
						</p>
						<RangeControl
							label="Between fields"
							value={layout.spacing.fieldGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.fieldGap)}
							onChange={(value) => updateSpacing("fieldGap", value)}
						/>
						<RangeControl
							label="Section title & fields"
							value={layout.spacing.sectionTitleGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.sectionTitleGap)}
							onChange={(value) => updateSpacing("sectionTitleGap", value)}
						/>
						<RangeControl
							label="Between sections"
							value={layout.spacing.sectionGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.sectionGap)}
							onChange={(value) => updateSpacing("sectionGap", value)}
						/>
						<RangeControl
							label="Last section & submit button"
							value={layout.spacing.submitGap}
							min={0}
							max={16}
							step={0.25}
							displayValue={spacingValue(layout.spacing.submitGap)}
							onChange={(value) => updateSpacing("submitGap", value)}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			<Separator />
			<div>
				<h3 className="text-sm font-semibold">Submit button</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					Choose where people find the final action.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="form-submit-alignment">Button position</Label>
				<Select
					value={layout.submitAlignment}
					onValueChange={(submitAlignment) =>
						onChange({
							...layout,
							submitAlignment:
								submitAlignment as Required<FormLayout>["submitAlignment"],
						})
					}
				>
					<SelectTrigger id="form-submit-alignment">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="left">Left aligned</SelectItem>
						<SelectItem value="center">Centered</SelectItem>
						<SelectItem value="right">Right aligned</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
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
	const [draftLayout, setDraftLayout] = useState(() =>
		normalizeFormLayout(structure.layout),
	);
	const [showColorCodes, setShowColorCodes] = useState(false);
	const [advancedSections, setAdvancedSections] = useState<string[]>([]);
	const [mobileView, setMobileView] = useState("controls");
	const [customizationTab, setCustomizationTab] = useState("appearance");
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
	const previewWidth = {
		compact: "max-w-xl",
		standard: "max-w-2xl",
		wide: "max-w-4xl",
	}[draftLayout.contentWidth];
	const previewPosition =
		draftLayout.contentAlignment === "left" ? "mr-auto" : "mx-auto";
	const sectionSpacing = {
		compact: "p-3 sm:p-4",
		comfortable: "p-4 sm:p-6",
		spacious: "p-6 sm:p-8",
	}[draftLayout.sectionSpacing];
	const layoutGap = (units: number) => `calc(var(--spacing) * ${units})`;
	const headerAlignment =
		draftLayout.headerAlignment === "center"
			? "items-center text-center"
			: "items-start text-left";
	const submitAlignment = {
		left: "justify-start",
		center: "justify-center",
		right: "justify-end",
	}[draftLayout.submitAlignment];
	const updateColor = (token: FormColorToken, value: string) =>
		setDraft((current) => ({
			...current,
			colors: { ...current.colors, [token]: value },
		}));
	const updateFont = (fontFamily: FormTheme["fontFamily"]) =>
		setDraft((current) => ({
			...current,
			fontFamily,
			fonts: {
				...(normalizeFormTheme(current).fonts as NonNullable<
					FormTheme["fonts"]
				>),
				sans: FORM_FONTS[fontFamily].value,
			},
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
					<Tabs value={customizationTab} onValueChange={setCustomizationTab}>
						<TabsList className="w-full" aria-label="Customization category">
							<TabsTrigger value="appearance" className="flex-1">
								Appearance
							</TabsTrigger>
							<TabsTrigger value="layout" className="flex-1">
								Layout
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<div
						className={cn(
							"flex flex-col gap-2",
							customizationTab === "appearance" ? "flex" : "hidden",
						)}
					>
						<Label htmlFor="form-theme-preset">Form style</Label>
						<ThemePresetPicker onSelect={setDraft} />
					</div>
					<Accordion
						type="multiple"
						defaultValue={["basic"]}
						className={customizationTab === "appearance" ? undefined : "hidden"}
					>
						<AccordionItem value="basic">
							<AccordionTrigger>Make it yours</AccordionTrigger>
							<AccordionContent>
								<p className="mb-4 text-xs text-muted-foreground">
									Start with what people notice first. Every detail is still
									available in Advanced customizations.
								</p>
								<Accordion
									type="multiple"
									defaultValue={["colors", "text", "finish"]}
								>
									<AccordionItem value="colors">
										<AccordionTrigger>Colors & surfaces</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-5">
											{BASIC_THEME_COLOR_GROUPS.map((group) => (
												<fieldset
													key={group.label}
													className="flex flex-col gap-3"
												>
													<legend className="text-sm font-medium">
														{group.label}
													</legend>
													<p className="text-xs text-muted-foreground">
														{group.description}
													</p>
													<div className="grid grid-cols-2 gap-3">
														{group.tokens.map((token) => (
															<ColorControl
																key={token}
																label={THEME_COLOR_LABELS[token]}
																showCode={false}
																value={draft.colors[token] ?? "#000000"}
																onChange={(value) => updateColor(token, value)}
															/>
														))}
													</div>
												</fieldset>
											))}
										</AccordionContent>
									</AccordionItem>
									<AccordionItem value="text">
										<AccordionTrigger>Text</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-5">
											<FontControl theme={draft} onChange={updateFont} />
											<RangeControl
												label="Letter spacing"
												value={draft.letterSpacing}
												min={-0.5}
												max={0.5}
												step={0.005}
												displayValue={`${Number((draft.letterSpacing * 100).toFixed(1))}%`}
												onChange={(letterSpacing) =>
													setDraft((current) => ({ ...current, letterSpacing }))
												}
											/>
										</AccordionContent>
									</AccordionItem>
									<AccordionItem value="finish">
										<AccordionTrigger>Depth & polish</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-5">
											<RangeControl
												label="Shadow strength"
												value={draft.shadow.opacity}
												min={0}
												max={1}
												step={0.01}
												displayValue={`${Math.round(draft.shadow.opacity * 100)}%`}
												onChange={(value) => updateShadow("opacity", value)}
											/>
											<RangeControl
												label="Shadow softness"
												value={draft.shadow.blur}
												min={0}
												max={200}
												unit="px"
												onChange={(value) => updateShadow("blur", value)}
											/>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="advanced">
							<AccordionTrigger>Advanced customizations</AccordionTrigger>
							<AccordionContent>
								<Accordion
									type="multiple"
									value={advancedSections}
									onValueChange={setAdvancedSections}
								>
									<AccordionItem value="colors">
										<AccordionTrigger>All colors</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-5">
											<p className="text-xs text-muted-foreground">
												Choose a color swatch to change it. Watch your form
												update in the preview.
											</p>
											<div className="flex items-center justify-between gap-3">
												<Label htmlFor="show-color-codes">
													Show color codes
												</Label>
												<Switch
													id="show-color-codes"
													checked={showColorCodes}
													onCheckedChange={setShowColorCodes}
												/>
											</div>
											{FORM_COLOR_GROUPS.map((group) => (
												<fieldset
													key={group.label}
													className="flex flex-col gap-3"
												>
													<legend className="mb-2 text-sm font-semibold">
														{THEME_COLOR_GROUP_DETAILS[group.label].label}
													</legend>
													<p className="text-xs text-muted-foreground">
														{THEME_COLOR_GROUP_DETAILS[group.label].description}
													</p>
													{group.tokens.map((token) => (
														<ColorControl
															key={token}
															label={THEME_COLOR_LABELS[token]}
															showCode={showColorCodes}
															value={draft.colors[token] ?? "#000000"}
															onChange={(value) => updateColor(token, value)}
														/>
													))}
													<Separator className="mt-2" />
												</fieldset>
											))}
										</AccordionContent>
									</AccordionItem>
									<AccordionItem value="other">
										<AccordionTrigger>More shadow controls</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-6">
											<ColorControl
												label="Shadow color"
												value={draft.shadow.color}
												showCode={false}
												onChange={(value) => updateShadow("color", value)}
											/>
											<RangeControl
												label="Shadow size adjustment"
												value={draft.shadow.spread}
												min={-200}
												max={200}
												unit="px"
												onChange={(value) => updateShadow("spread", value)}
											/>
											<RangeControl
												label="Shadow horizontal position"
												value={draft.shadow.x}
												min={-200}
												max={200}
												unit="px"
												onChange={(value) => updateShadow("x", value)}
											/>
											<RangeControl
												label="Shadow vertical position"
												value={draft.shadow.y}
												min={-200}
												max={200}
												unit="px"
												onChange={(value) => updateShadow("y", value)}
											/>
											<p className="text-xs text-muted-foreground">
												Shape shadows without needing CSS.
											</p>
										</AccordionContent>
									</AccordionItem>
									<AccordionItem value="import">
										<AccordionTrigger>
											<span className="flex items-center gap-2">
												<CodeIcon className="size-4" />
												Import or export a theme
											</span>
										</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-3">
											<Label htmlFor="form-theme-css">Theme code</Label>
											<Textarea
												id="form-theme-css"
												value={css}
												aria-invalid={Boolean(cssError)}
												aria-describedby={
													cssError ? "form-theme-css-error" : undefined
												}
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
															toast.success("Theme code copied");
														} catch {
															toast.message(
																"Select the theme code above to copy it.",
															);
														}
													}}
												>
													<CopyIcon data-icon="inline-start" />
													Copy theme code
												</Button>
											</div>
											<Label htmlFor="form-theme-file">
												Theme file (CSS or JSON)
											</Label>
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
											<Label htmlFor="form-theme-url">
												Theme link from tweakcn
											</Label>
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
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<div className={customizationTab === "layout" ? undefined : "hidden"}>
						<LayoutControls
							layout={draftLayout}
							theme={draft}
							onChange={setDraftLayout}
							onThemeChange={setDraft}
						/>
					</div>
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
							<div
								className={cn(
									"flex w-full flex-col",
									previewPosition,
									previewWidth,
								)}
							>
								<header
									className={cn("flex flex-col", headerAlignment)}
									style={{
										gap: layoutGap(draftLayout.spacing.titleDescriptionGap),
									}}
								>
									<h2 className="text-2xl font-bold md:text-4xl">{title}</h2>
									{description ? (
										<p className="text-muted-foreground">{description}</p>
									) : null}
								</header>
								<div
									className="flex flex-col"
									style={{
										gap: layoutGap(draftLayout.spacing.sectionGap),
										marginTop: layoutGap(draftLayout.spacing.titleContentGap),
									}}
								>
									{sections.map((section, index) => (
										<section
											key={section.id}
											className={cn(
												"flex min-w-0 flex-col border bg-card",
												sectionSpacing,
											)}
										>
											<div
												className="flex flex-col gap-1 border-b pb-4"
												style={{
													marginBottom: layoutGap(
														draftLayout.spacing.sectionTitleGap,
													),
												}}
											>
												<h3 className="text-base font-semibold">
													{section.title || `Section ${index + 1}`}
												</h3>
												{"description" in section && section.description ? (
													<p className="text-sm text-muted-foreground">
														{section.description}
													</p>
												) : null}
											</div>
											<div
												className="flex flex-col"
												style={{ gap: layoutGap(draftLayout.spacing.fieldGap) }}
											>
												{section.fields.map(renderField)}
												{section.fields.length === 0 ? (
													<p className="text-sm text-muted-foreground">
														Add fields in the builder to preview them here.
													</p>
												) : null}
											</div>
										</section>
									))}
								</div>
								<div
									className={cn("flex", submitAlignment)}
									style={{
										marginTop: layoutGap(draftLayout.spacing.submitGap),
									}}
								>
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
					disabled={!structure.theme && !structure.layout}
					onClick={() => {
						onUpdate(undefined, undefined);
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
							onUpdate(draft, draftLayout);
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
