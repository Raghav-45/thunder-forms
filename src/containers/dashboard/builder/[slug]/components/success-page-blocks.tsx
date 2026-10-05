import {
	PointerActivationConstraints,
	PointerSensor,
	type Sensors,
} from "@dnd-kit/dom";
import { useSortable } from "@dnd-kit/react/sortable";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	PencilIcon,
	PlusIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { Textarea } from "#/components/ui/textarea";
import AccordionWithSwitch from "#/features/form-builder/components/accordion-with-switch";
import {
	REDIRECT_COUNTDOWN_SECONDS,
	resolveSuccessContent,
	SubmittedButtonsBlock,
	SubmittedMessageBlock,
	SubmittedTitleBlock,
} from "#/features/form-builder/components/form-submitted-page";
import { cn } from "#/lib/utils";
import type { SuccessBlockId, SuccessExtraButton } from "#/lib/validators/form";

export interface SuccessPageCustomization {
	submitAnotherResponseText: string;
	returnToHomepageText: string;
	showSubmitAnotherResponse: boolean;
	showReturnToHomepage: boolean;
	extraButtons: SuccessExtraButton[];
}

export interface SuccessPageSettings extends SuccessPageCustomization {
	redirectUrl?: string;
	title: string;
	message: string;
	blockOrder: SuccessBlockId[];
}

export const SUCCESS_BLOCK_LABELS: Record<SuccessBlockId, string> = {
	title: "Title",
	message: "Message",
	buttons: "Buttons",
};

export const successBlockSensors = (defaults: Sensors) => [
	...defaults.filter((sensor) => sensor !== PointerSensor),
	PointerSensor.configure({
		activationConstraints(event: PointerEvent, _source) {
			if (event.pointerType === "touch") {
				return [
					new PointerActivationConstraints.Delay({
						value: 500,
						tolerance: { x: 5, y: 5 },
					}),
				];
			}
			return [new PointerActivationConstraints.Distance({ value: 8 })];
		},
	}),
];

function normalizeButtonUrl(url: string) {
	const trimmed = url.trim();
	if (!trimmed) return trimmed;
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidButtonUrl(url: string) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

const BLOCK_ACTION_BUTTON_CLASS =
	"h-8 w-8 cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary";

export function SuccessBlockFrame({
	block,
	label,
	canMoveUp,
	canMoveDown,
	dragging = false,
	rootRef,
	onEdit,
	onMoveUp,
	onMoveDown,
	children,
}: {
	block: SuccessBlockId;
	label: string;
	canMoveUp: boolean;
	canMoveDown: boolean;
	dragging?: boolean;
	rootRef?: (element: HTMLDivElement | null) => void;
	onEdit: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			ref={rootRef}
			data-success-block={block}
			className={cn(
				"group/success-block relative cursor-grab rounded-lg border-2 border-dashed border-border p-3 transition-[border-color,box-shadow] duration-200 hover:border-primary/50 hover:shadow-sm active:cursor-grabbing",
				dragging && "opacity-30",
			)}
		>
			<div inert className="pointer-events-none">
				{children}
			</div>
			<div
				className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover/success-block:opacity-100 focus-within:opacity-100"
				onPointerDown={(event) => event.stopPropagation()}
			>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={BLOCK_ACTION_BUTTON_CLASS}
					onClick={onEdit}
				>
					<PencilIcon className="h-4 w-4" />
					<span className="sr-only">Edit success {label}</span>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={BLOCK_ACTION_BUTTON_CLASS}
					disabled={!canMoveUp}
					onClick={onMoveUp}
				>
					<ChevronUpIcon className="h-4 w-4" />
					<span className="sr-only">Move success {label} up</span>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={BLOCK_ACTION_BUTTON_CLASS}
					disabled={!canMoveDown}
					onClick={onMoveDown}
				>
					<ChevronDownIcon className="h-4 w-4" />
					<span className="sr-only">Move success {label} down</span>
				</Button>
			</div>
		</div>
	);
}

export function SortableSuccessBlock({
	block,
	index,
	label,
	canMoveUp,
	canMoveDown,
	onEdit,
	onMoveUp,
	onMoveDown,
	children,
}: {
	block: SuccessBlockId;
	index: number;
	label: string;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onEdit: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	children: React.ReactNode;
}) {
	const { ref, isDragging } = useSortable({
		id: block,
		group: "success-blocks",
		type: "success-block",
		accept: ["success-block"],
		index,
	});

	return (
		<SuccessBlockFrame
			block={block}
			label={label}
			canMoveUp={canMoveUp}
			canMoveDown={canMoveDown}
			dragging={isDragging}
			rootRef={ref}
			onEdit={onEdit}
			onMoveUp={onMoveUp}
			onMoveDown={onMoveDown}
		>
			{children}
		</SuccessBlockFrame>
	);
}

function ButtonRow({
	legend,
	label,
	inputId,
	placeholder,
	helperText,
	value,
	onValueChange,
	url,
	onUrlChange,
	removeLabel,
	onRemove,
}: {
	legend: string;
	label: string;
	inputId: string;
	placeholder: string;
	helperText: string;
	value: string;
	onValueChange: (value: string) => void;
	url?: string;
	onUrlChange?: (url: string) => void;
	removeLabel: string;
	onRemove: () => void;
}) {
	const trimmedUrl = url?.trim() ?? "";
	const invalidUrl = trimmedUrl.length > 0 && !isValidButtonUrl(trimmedUrl);
	return (
		<fieldset className="flex flex-col gap-2 rounded-lg border border-border/70 p-3">
			<legend className="px-1 text-xs font-medium text-muted-foreground">
				{legend}
			</legend>
			<div className="flex items-center justify-end gap-3">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={removeLabel}
					onClick={onRemove}
				>
					<XIcon data-icon="inline-start" />
					Remove
				</Button>
			</div>
			<Label htmlFor={inputId}>{label}</Label>
			<Input
				id={inputId}
				placeholder={placeholder}
				maxLength={50}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
			/>
			<p className="text-xs text-muted-foreground">{helperText}</p>
			{onUrlChange ? (
				<>
					<Label htmlFor={`${inputId}-url`}>Link URL</Label>
					<Input
						id={`${inputId}-url`}
						type="url"
						inputMode="url"
						placeholder="https://example.com/help"
						aria-invalid={invalidUrl}
						aria-describedby={invalidUrl ? `${inputId}-url-error` : undefined}
						value={url ?? ""}
						onChange={(event) => onUrlChange(event.target.value)}
						onBlur={(event) => {
							const normalized = normalizeButtonUrl(event.target.value);
							if (normalized !== event.target.value) {
								onUrlChange(normalized);
							}
						}}
					/>
					{invalidUrl ? (
						<p id={`${inputId}-url-error`} className="text-xs text-destructive">
							Enter a valid URL, e.g. https://example.com/help.
						</p>
					) : null}
				</>
			) : null}
		</fieldset>
	);
}

function SuccessButtonList({
	buttons,
	onChange,
}: {
	buttons: SuccessPageCustomization;
	onChange: (buttons: SuccessPageCustomization) => void;
}) {
	const updateExtraButton = (id: string, update: Partial<SuccessExtraButton>) =>
		onChange({
			...buttons,
			extraButtons: buttons.extraButtons.map((button) =>
				button.id === id ? { ...button, ...update } : button,
			),
		});
	const isEmpty =
		!buttons.showSubmitAnotherResponse &&
		!buttons.showReturnToHomepage &&
		buttons.extraButtons.length === 0;
	return (
		<div className="flex flex-col gap-3">
			{buttons.showSubmitAnotherResponse ? (
				<ButtonRow
					legend="Submit-again button"
					label="Submit-again button text"
					inputId="form-success-again-text"
					placeholder="Submit Another Response"
					helperText="Leave blank to use “Submit Another Response”."
					value={buttons.submitAnotherResponseText}
					onValueChange={(submitAnotherResponseText) =>
						onChange({ ...buttons, submitAnotherResponseText })
					}
					removeLabel="Remove submit-again button"
					onRemove={() =>
						onChange({ ...buttons, showSubmitAnotherResponse: false })
					}
				/>
			) : null}
			{buttons.showReturnToHomepage ? (
				<ButtonRow
					legend="Homepage button"
					label="Homepage button text"
					inputId="form-success-home-text"
					placeholder="Return to Homepage"
					helperText="Leave blank to use “Return to Homepage”."
					value={buttons.returnToHomepageText}
					onValueChange={(returnToHomepageText) =>
						onChange({ ...buttons, returnToHomepageText })
					}
					removeLabel="Remove homepage button"
					onRemove={() => onChange({ ...buttons, showReturnToHomepage: false })}
				/>
			) : null}
			{buttons.extraButtons.map((button) => (
				<ButtonRow
					key={button.id}
					legend="Link button"
					label="Button text"
					inputId={`extra-button-label-${button.id}`}
					placeholder="Help center"
					helperText="Shown after the built-in buttons."
					value={button.label}
					onValueChange={(label) => updateExtraButton(button.id, { label })}
					url={button.url}
					onUrlChange={(url) => updateExtraButton(button.id, { url })}
					removeLabel={`Remove ${button.label.trim() || "extra button"}`}
					onRemove={() =>
						onChange({
							...buttons,
							extraButtons: buttons.extraButtons.filter(
								(candidate) => candidate.id !== button.id,
							),
						})
					}
				/>
			))}
			{isEmpty ? (
				<p className="text-xs text-muted-foreground">
					No buttons. Respondents will see only the confirmation.
				</p>
			) : null}
			<div className="flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					{!buttons.showSubmitAnotherResponse ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								onChange({ ...buttons, showSubmitAnotherResponse: true })
							}
						>
							<PlusIcon data-icon="inline-start" />
							Submit-again button
						</Button>
					) : null}
					{!buttons.showReturnToHomepage ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								onChange({ ...buttons, showReturnToHomepage: true })
							}
						>
							<PlusIcon data-icon="inline-start" />
							Homepage button
						</Button>
					) : null}
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={buttons.extraButtons.length >= 10}
						onClick={() =>
							onChange({
								...buttons,
								extraButtons: [
									...buttons.extraButtons,
									{
										id: `extra_${crypto.randomUUID().slice(0, 8)}`,
										label: "",
										url: "",
									},
								],
							})
						}
					>
						<PlusIcon data-icon="inline-start" />
						Link button
					</Button>
				</div>
				{buttons.extraButtons.length >= 10 ? (
					<p className="text-xs text-muted-foreground">
						A success page holds at most 10 extra buttons.
					</p>
				) : null}
			</div>
		</div>
	);
}

export function SuccessBlockEditor({
	block,
	settings,
	onUpdate,
	onClose,
}: {
	block: SuccessBlockId;
	settings: SuccessPageSettings;
	onUpdate: (update: Partial<SuccessPageSettings>) => void;
	onClose: () => void;
}) {
	const [title, setTitle] = useState(settings.title);
	const [message, setMessage] = useState(settings.message);
	const [buttons, setButtons] = useState<SuccessPageCustomization>({
		submitAnotherResponseText: settings.submitAnotherResponseText,
		returnToHomepageText: settings.returnToHomepageText,
		showSubmitAnotherResponse: settings.showSubmitAnotherResponse,
		showReturnToHomepage: settings.showReturnToHomepage,
		extraButtons: settings.extraButtons,
	});

	const save = () => {
		if (block === "title") {
			onUpdate({ title: title.trim() });
		} else if (block === "message") {
			onUpdate({ message: message.trim() });
		} else {
			onUpdate({ ...buttons });
		}
		onClose();
	};

	return (
		<Sheet open onOpenChange={onClose}>
			<SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
				<SheetHeader>
					<SheetTitle className="text-lg">
						Configure success {SUCCESS_BLOCK_LABELS[block].toLowerCase()}
					</SheetTitle>
				</SheetHeader>

				<div className="space-y-2 px-4">
					<Accordion type="multiple" defaultValue={["basic"]}>
						<AccordionItem value="basic">
							<AccordionTrigger className="text-base">
								{block === "buttons" ? "Buttons" : "Basic Properties"}
							</AccordionTrigger>
							<AccordionContent className="flex flex-col gap-y-2">
								{block === "title" ? (
									<AccordionWithSwitch
										text="Custom heading"
										defaultOpen={title.trim().length > 0}
									>
										<div className="space-y-2">
											<Label htmlFor="field-label">Heading</Label>
											<Input
												id="field-label"
												value={title}
												maxLength={100}
												onChange={(event) => setTitle(event.target.value)}
												placeholder="Form Submitted"
											/>
											<p className="text-xs text-muted-foreground">
												Leave blank to use “Form Submitted”.
											</p>
										</div>
									</AccordionWithSwitch>
								) : null}
								{block === "message" ? (
									<AccordionWithSwitch
										text="Custom message"
										defaultOpen={message.trim().length > 0}
									>
										<div className="space-y-2">
											<Label htmlFor="field-description">Message</Label>
											<Textarea
												id="field-description"
												value={message}
												maxLength={1000}
												onChange={(event) => setMessage(event.target.value)}
												placeholder="Thank you for your submission! We've received your request."
												rows={4}
											/>
											<p className="text-xs text-muted-foreground">
												Leave blank to use the default thank-you message.
											</p>
										</div>
									</AccordionWithSwitch>
								) : null}
								{block === "buttons" ? (
									<SuccessButtonList buttons={buttons} onChange={setButtons} />
								) : null}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>

				<SheetFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="button" onClick={save}>
						Save Changes
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export function SuccessBlockOverlayContent({
	block,
	settings,
}: {
	block: SuccessBlockId;
	settings: SuccessPageSettings;
}) {
	const content = resolveSuccessContent({
		titleText: settings.title,
		messageText: settings.message,
		submitAnotherResponseText: settings.submitAnotherResponseText,
		returnToHomepageText: settings.returnToHomepageText,
		showSubmitAnotherResponse: settings.showSubmitAnotherResponse,
		showReturnToHomepage: settings.showReturnToHomepage,
		extraButtons: settings.extraButtons,
		redirectUrl: settings.redirectUrl,
	});
	if (block === "title") {
		return <SubmittedTitleBlock title={content.title} />;
	}
	if (block === "message") {
		return (
			<SubmittedMessageBlock
				message={content.message}
				quizPendingReview={false}
				quizResult={null}
				finalRedirectUrl={content.finalRedirectUrl}
				countdown={REDIRECT_COUNTDOWN_SECONDS}
			/>
		);
	}
	if (!content.hasActions) {
		return (
			<p className="py-2 text-center text-xs text-muted-foreground">
				Buttons are hidden
			</p>
		);
	}
	return (
		<SubmittedButtonsBlock
			formPath="#"
			submitAnotherLabel={content.submitAnotherLabel}
			homepageLabel={content.homepageLabel}
			showSubmitAnotherResponse={settings.showSubmitAnotherResponse}
			showReturnToHomepage={settings.showReturnToHomepage}
			visibleExtraButtons={content.visibleExtraButtons}
		/>
	);
}
