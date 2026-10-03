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
import {
	ItemCard,
	SectionCard,
} from "#/containers/dashboard/builder/[slug]/components/builder-cards";
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
import { FORM_SUBMIT_WIDTH_CLASSES } from "#/features/form-builder/constants";
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
	getFormThemeStyle,
	getTweakcnRegistryUrl,
	importFormThemeCss,
	importFormThemeVariables,
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
	canvasWidth?: number | null;
	title: string;
	description?: string;
	submitButtonText?: string;
	onUpdate: (
		theme: FormTheme | undefined,
		layout: FormLayout | undefined,
		submitButtonText: string | undefined,
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
	submitButtonText,
	onChange,
	onThemeChange,
	onSubmitButtonTextChange,
}: {
	layout: NormalizedFormLayout;
	theme: FormTheme;
	submitButtonText: string;
	onChange: (layout: NormalizedFormLayout) => void;
	onThemeChange: (theme: FormTheme) => void;
	onSubmitButtonTextChange: (text: string) => void;
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
		<Accordion
			type="multiple"
			defaultValue={["heading", "form", "sections", "submit"]}
		>
			<AccordionItem value="heading">
				<AccordionTrigger>Form heading</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-5">
					<p className="text-xs text-muted-foreground">
						Position the heading and adjust the space around it.
					</p>
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-header-alignment">Heading alignment</Label>
						<Select
							value={layout.headerAlignment}
							onValueChange={(headerAlignment) =>
								onChange({
									...layout,
									headerAlignment:
										headerAlignment as NormalizedFormLayout["headerAlignment"],
								})
							}
						>
							<SelectTrigger id="form-header-alignment" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="left">Left aligned</SelectItem>
									<SelectItem value="center">Centered</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<RangeControl
						label="Space between title & description"
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
			<AccordionItem value="form">
				<AccordionTrigger>Form width & position</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-content-width">Form width</Label>
						<Select
							value={layout.contentWidth}
							onValueChange={(contentWidth) =>
								onChange({
									...layout,
									contentWidth:
										contentWidth as NormalizedFormLayout["contentWidth"],
								})
							}
						>
							<SelectTrigger id="form-content-width" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="compact">Compact</SelectItem>
									<SelectItem value="standard">Standard</SelectItem>
									<SelectItem value="wide">Wide</SelectItem>
								</SelectGroup>
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
										contentAlignment as NormalizedFormLayout["contentAlignment"],
								})
							}
						>
							<SelectTrigger id="form-content-alignment" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="left">Left aligned</SelectItem>
									<SelectItem value="center">Centered</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="sections">
				<AccordionTrigger>Sections & spacing</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-section-spacing">Space inside sections</Label>
						<Select
							value={layout.sectionSpacing}
							onValueChange={(sectionSpacing) =>
								onChange({
									...layout,
									sectionSpacing:
										sectionSpacing as NormalizedFormLayout["sectionSpacing"],
								})
							}
						>
							<SelectTrigger id="form-section-spacing" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="compact">Compact</SelectItem>
									<SelectItem value="comfortable">Comfortable</SelectItem>
									<SelectItem value="spacious">Spacious</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
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
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="submit">
				<AccordionTrigger>Submit button</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-submit-text">Submit button text</Label>
						<Input
							id="form-submit-text"
							placeholder="Submit"
							maxLength={50}
							value={submitButtonText}
							onChange={(event) => onSubmitButtonTextChange(event.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							Leave blank to use “Submit”.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-submit-width">Button width</Label>
						<Select
							value={layout.submitWidth}
							onValueChange={(submitWidth) =>
								onChange({
									...layout,
									submitWidth:
										submitWidth as NormalizedFormLayout["submitWidth"],
								})
							}
						>
							<SelectTrigger id="form-submit-width" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="auto">Auto width</SelectItem>
									<SelectItem value="full">Full width</SelectItem>
									<SelectItem value="responsive">
										Full width on phones
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="form-submit-alignment">Button position</Label>
						<Select
							value={layout.submitAlignment}
							disabled={layout.submitWidth === "full"}
							onValueChange={(submitAlignment) =>
								onChange({
									...layout,
									submitAlignment:
										submitAlignment as NormalizedFormLayout["submitAlignment"],
								})
							}
						>
							<SelectTrigger id="form-submit-alignment" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="left">Left aligned</SelectItem>
									<SelectItem value="center">Centered</SelectItem>
									<SelectItem value="right">Right aligned</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						{layout.submitWidth === "full" ? (
							<p className="text-xs text-muted-foreground">
								Choose auto width to set a button position.
							</p>
						) : null}
					</div>
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
	canvasWidth,
	title,
	description,
	submitButtonText,
	onUpdate,
	onClose,
}: FormCustomizationProps & { onClose: () => void }) {
	// Opening Customize must preserve an uncustomized form's current appearance.
	const [initialTheme] = useState(() => {
		if (structure.theme)
			return structuredClone(normalizeFormTheme(structure.theme));
		const defaultTheme = createFormTheme();
		const appStyle = getComputedStyle(document.documentElement);
		return importFormThemeVariables(
			Object.fromEntries(
				Object.keys(getFormThemeStyle(defaultTheme) ?? {})
					.filter((key) => key.startsWith("--"))
					.map((key) => [key, appStyle.getPropertyValue(key).trim()])
					.filter(([, value]) => value),
			),
			defaultTheme,
		);
	});
	const [draft, setDraft] = useState(() => structuredClone(initialTheme));
	const themeChanged = JSON.stringify(draft) !== JSON.stringify(initialTheme);
	const previewTheme = structure.theme || themeChanged ? draft : undefined;
	const [initialLayout] = useState(() =>
		normalizeFormLayout(
			structure.layout ?? {
				sectionSpacing: "compact",
				spacing: { fieldGap: 3, sectionGap: 4, sectionTitleGap: 4 },
			},
		),
	);
	const [draftLayout, setDraftLayout] = useState(() =>
		structuredClone(initialLayout),
	);
	const layoutChanged =
		JSON.stringify(draftLayout) !== JSON.stringify(initialLayout);
	const [draftSubmitButtonText, setDraftSubmitButtonText] = useState(
		submitButtonText ?? "",
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
											<div className="grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2">
												<Button
													type="button"
													size="sm"
													variant="outline"
													className="h-auto min-h-8 min-w-0 px-2 whitespace-normal"
													disabled={isImporting}
													onClick={() => importTheme(css)}
												>
													Import theme
												</Button>
												<Button
													type="button"
													size="sm"
													variant="outline"
													className="h-auto min-h-8 min-w-0 px-2 whitespace-normal"
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
							submitButtonText={draftSubmitButtonText}
							onChange={setDraftLayout}
							onThemeChange={setDraft}
							onSubmitButtonTextChange={setDraftSubmitButtonText}
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
						<div
							className={cn(
								"min-h-full p-[12px] md:p-[16px]",
								previewTheme ? "bg-background" : "bg-card",
							)}
							data-testid="customization-preview"
							data-form-theme={previewTheme ? true : undefined}
							style={getFormThemeStyle(previewTheme)}
						>
							<FormThemeScope theme={previewTheme}>
								<div
									className={cn(
										"flex w-full flex-col font-sans",
										previewPosition,
										(draftLayout.contentWidth !== initialLayout.contentWidth ||
											!hasFields) &&
											previewWidth,
									)}
									style={{
										width: canvasWidth
											? `min(100%, ${canvasWidth}px)`
											: undefined,
									}}
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
											gap: layoutGap(
												layoutChanged ? draftLayout.spacing.sectionGap : 4,
											),
											marginTop: layoutGap(draftLayout.spacing.titleContentGap),
										}}
									>
										{sections.map((section, index) => (
											<SectionCard
												key={section.id}
												label={section.title || `Section ${index + 1}`}
												description={
													"description" in section
														? section.description
														: undefined
												}
												isEmpty={section.fields.length === 0}
												reserveActions
												layout={layoutChanged ? draftLayout : undefined}
											>
												{section.fields.map((field) => (
													<ItemCard key={field.id} field={field} interactive>
														{renderField(field)}
													</ItemCard>
												))}
											</SectionCard>
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
											className={cn(
												"h-auto min-h-9 max-w-full whitespace-normal break-words",
												FORM_SUBMIT_WIDTH_CLASSES[draftLayout.submitWidth],
											)}
											onClick={() =>
												toast.message(
													"This is a preview. Your answers are not submitted.",
												)
											}
										>
											{draftSubmitButtonText.trim() || "Submit"}
										</Button>
									</div>
								</div>
							</FormThemeScope>
						</div>
					</div>
				</div>
			</div>
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!structure.theme && !structure.layout && !submitButtonText}
					onClick={() => {
						onUpdate(undefined, undefined, undefined);
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
							if (
								!layoutChanged &&
								!themeChanged &&
								draftSubmitButtonText === (submitButtonText ?? "")
							) {
								onClose();
								return;
							}
							onUpdate(
								previewTheme,
								layoutChanged ? draftLayout : structure.layout,
								draftSubmitButtonText.trim() || undefined,
							);
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
