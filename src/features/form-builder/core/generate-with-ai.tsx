import {
	AnimatePresence,
	motion,
	type Transition,
	useReducedMotion,
	type Variants,
} from "motion/react";
import {
	type FC,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { Icons } from "#/components/Icons";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { ShineBorder } from "#/components/ui/shine-border";
import {
	countTemplateFields,
	FORM_TEMPLATES,
} from "#/containers/dashboard/templates/constants";
import {
	type GeneratedForm,
	GeneratedFormResponseValidator,
} from "#/features/form-builder/core/generated-form";

// Tailwind port of the Generate With AI dialog. All visuals are Tailwind
// utilities; animation tokens (--animate-ag-*) live in src/styles.css,
// @property + Firefox scrollbar hook appended there.

interface GenerateWithAiPromptProps {
	onGeneratedForm: (form: GeneratedForm) => void;
}

type Panel = "suggested" | "templates" | "options";
type Phase = "idle" | "building";

interface Choice {
	category: string;
	description: string;
	fields: string;
	id: string;
	icon: string;
	prompt: string;
	title: string;
}

const SUGGESTIONS: Choice[] = [
	{
		category: "business",
		description: "Name, email, subject, message",
		fields: "4 fields",
		icon: "✉️",
		id: "contact",
		prompt: "A contact form with name, email, subject and message",
		title: "Contact form",
	},
	{
		category: "hr",
		description: "Resume upload, experience, cover letter",
		fields: "8 fields",
		icon: "💼",
		id: "job",
		prompt: "A job application form with resume upload and cover letter",
		title: "Job application",
	},
	{
		category: "events",
		description: "Tickets, attendees, dietary needs",
		fields: "7 fields",
		icon: "🎟️",
		id: "event",
		prompt: "An event registration form with ticket types and dietary needs",
		title: "Event registration",
	},
	{
		category: "surveys",
		description: "Rating, NPS, comments",
		fields: "5 fields",
		icon: "⭐",
		id: "feedback",
		prompt: "A customer feedback survey with rating and NPS",
		title: "Feedback survey",
	},
];

const TEMPLATE_ICONS: Record<string, string> = {
	Application: "💼",
	Contact: "✉️",
	Event: "🎟️",
	Feedback: "⭐",
	Support: "🛟",
	Survey: "📊",
};

const TEMPLATES: Choice[] = FORM_TEMPLATES.map((template) => ({
	category: template.category,
	description: template.description,
	fields: `${countTemplateFields(template)} fields`,
	icon: TEMPLATE_ICONS[template.category] ?? "📄",
	id: template.slug,
	prompt: `Use the ${template.title} template (slug: ${template.slug}) without modifications.`,
	title: template.title,
}));

const TEMPLATE_CATEGORIES = [
	"All",
	...new Set(TEMPLATES.map((template) => template.category)),
];

const PLACEHOLDERS = [
	"A contact form with name, email and message…",
	"A yoga studio signup with a waiver checkbox…",
	"A job application with resume upload…",
	"A customer feedback survey with NPS…",
];

const BUILD_STEPS = [
	"Understanding your prompt…",
	"Choosing field types…",
	"Adding validation…",
	"Laying out your form…",
];

const PANEL_ORDER: Panel[] = ["suggested", "templates", "options"];

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Failed to generate form";
}

/**
 * Tracks the rendered height of an element via ResizeObserver.
 *
 * Uses layout sizes (offsetHeight / borderBoxSize), which ignore CSS
 * transforms, so the dialog's open "zoom" animation can't skew the value.
 * Returns a callback ref (the Dialog content mounts lazily, so a plain
 * useRef + useEffect would run before the node exists).
 */
function useMeasuredHeight() {
	const [height, setHeight] = useState<number | null>(null);
	const observerRef = useRef<ResizeObserver | null>(null);

	const ref = useCallback((node: HTMLDivElement | null) => {
		observerRef.current?.disconnect();
		observerRef.current = null;
		if (!node) {
			setHeight(null);
			return;
		}
		setHeight(node.offsetHeight);
		const observer = new ResizeObserver(([entry]) => {
			setHeight(
				Math.ceil(
					entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
				),
			);
		});
		observer.observe(node);
		observerRef.current = observer;
	}, []);

	return [ref, height] as const;
}

// Animation tokens (--animate-ag-*) live in src/styles.css (@theme, next to
// the shine precedent); @property + Firefox scrollbar hook appended there.
// Everything else on the elements below is Tailwind utilities.

const GenerateWithAiPrompt: FC<GenerateWithAiPromptProps> = ({
	onGeneratedForm,
}) => {
	const [activePanel, setActivePanel] = useState<Panel>("suggested");
	const [buildStep, setBuildStep] = useState(0);
	const [category, setCategory] = useState("All");
	const [formLength, setFormLength] = useState("Standard");
	const [formType, setFormType] = useState("Form");
	const [isOpen, setIsOpen] = useState(false);
	const [panelDirection, setPanelDirection] = useState(0);
	const [phase, setPhase] = useState<Phase>("idle");
	const [placeholder, setPlaceholder] = useState(
		"Describe the form you want to build…",
	);
	const [prompt, setPrompt] = useState("");
	const [promptError, setPromptError] = useState<string | null>(null);
	const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
	const [bodyRef, bodyHeight] = useMeasuredHeight();
	// Pin the dialog top on mount: it starts centered, then stays fixed so
	// tab switches (and errors) only move the bottom edge. A callback ref
	// (not an effect + querySelector) guarantees the dialog node exists.
	const pinTopRef = useCallback(
		(node: HTMLDivElement | null) => {
			bodyRef(node);
			if (!node) return;
			const dialog = node.closest<HTMLElement>("[data-ai-generation-dialog]");
			if (dialog) {
				dialog.style.top = `${Math.max(0, (window.innerHeight - dialog.offsetHeight) / 2)}px`;
			}
		},
		[bodyRef],
	);
	const abortRef = useRef<AbortController | null>(null);
	const promptId = useId();
	const errorId = `${promptId}-error`;
	const isBuilding = phase === "building";
	const shouldReduceMotion = useReducedMotion();
	const visibleTemplates = TEMPLATES.filter(
		(template) => category === "All" || template.category === category,
	);

	const panelTransitionVariants: Variants = {
		initial: (direction: number) =>
			shouldReduceMotion
				? { opacity: 0 }
				: {
						opacity: 0,
						x: direction > 0 ? 80 : direction < 0 ? -80 : 0,
						scale: 0.98,
						filter: "blur(8px)",
					},
		animate: shouldReduceMotion
			? { opacity: 1 }
			: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
		exit: (direction: number) =>
			shouldReduceMotion
				? { opacity: 0 }
				: {
						opacity: 0,
						x: direction > 0 ? -80 : direction < 0 ? 80 : 0,
						scale: 0.98,
						filter: "blur(8px)",
					},
	};
	// Shared by the pane slide AND the container height so they move as one.
	const panelTransition: Transition = shouldReduceMotion
		? { duration: 0.15 }
		: { type: "spring", stiffness: 400, damping: 35, mass: 0.8 };
	const overlayTransition: Transition = shouldReduceMotion
		? { duration: 0.15 }
		: { duration: 0.32, ease: [0.16, 1, 0.3, 1] };
	const overlayVariants: Variants = {
		initial: shouldReduceMotion
			? { opacity: 0 }
			: { opacity: 0, scale: 0.985, filter: "blur(4px)" },
		animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
		exit: shouldReduceMotion
			? { opacity: 0 }
			: { opacity: 0, scale: 0.99, filter: "blur(2px)" },
	};

	// Typewriter placeholder
	useEffect(() => {
		if (!isOpen || prompt || phase !== "idle") return;
		let wordIndex = 0;
		let characterIndex = 0;
		let deleting = false;
		let timeout: ReturnType<typeof setTimeout>;
		const type = () => {
			const word = PLACEHOLDERS[wordIndex];
			characterIndex += deleting ? -1 : 1;
			setPlaceholder(word.slice(0, characterIndex) || "​");
			let delay = deleting ? 36 : 58;
			if (!deleting && characterIndex === word.length) {
				deleting = true;
				delay = 1800;
			} else if (deleting && characterIndex === 0) {
				deleting = false;
				wordIndex = (wordIndex + 1) % PLACEHOLDERS.length;
				delay = 350;
			}
			timeout = setTimeout(type, delay);
		};
		timeout = setTimeout(type, 350);
		return () => clearTimeout(timeout);
	}, [isOpen, phase, prompt]);

	// Cycle the status text while building
	useEffect(() => {
		if (!isBuilding) {
			setBuildStep(0);
			return;
		}
		const id = setInterval(
			() => setBuildStep((step) => Math.min(step + 1, BUILD_STEPS.length - 1)),
			1400,
		);
		return () => clearInterval(id);
	}, [isBuilding]);

	// Abort any in-flight request on unmount
	useEffect(() => () => abortRef.current?.abort(), []);

	function reset() {
		setPhase("idle");
		setPrompt("");
		setPromptError(null);
		setSelectedChoice(null);
		setFormLength("Standard");
		setFormType("Form");
	}

	function selectChoice(choice: Choice) {
		setPrompt(choice.prompt);
		setSelectedChoice(choice.id);
		setPromptError(null);
	}

	function selectPanel(panel: Panel) {
		if (panel === activePanel) return;
		setPanelDirection(
			PANEL_ORDER.indexOf(panel) > PANEL_ORDER.indexOf(activePanel) ? 1 : -1,
		);
		setActivePanel(panel);
	}

	// Sliding tab indicator: measured button geometry (offsetLeft/offsetWidth
	// already include container padding and gaps), glided with a CSS
	// transition. Measured from a callback ref on the tab row itself: Radix
	// mounts the dialog content a commit after isOpen flips, so an effect
	// alone would miss the buttons on open. Re-measured on tab change and
	// window resize.
	const [pill, setPill] = useState<{ left: number; width: number } | null>(
		null,
	);
	const modesRef = useRef<HTMLDivElement | null>(null);
	const measurePill = useCallback(() => {
		const selected = modesRef.current?.querySelector<HTMLElement>(
			'[aria-selected="true"]',
		);
		if (!selected) return;
		const next = { left: selected.offsetLeft, width: selected.offsetWidth };
		setPill((previous) =>
			previous && previous.left === next.left && previous.width === next.width
				? previous
				: next,
		);
	}, []);
	const modesRefCallback = useCallback(
		(node: HTMLDivElement | null) => {
			modesRef.current = node;
			if (node) measurePill();
		},
		[measurePill],
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Remeasure the mounted DOM when the selected tab or dialog visibility changes.
	useLayoutEffect(() => {
		measurePill();
		window.addEventListener("resize", measurePill);
		return () => window.removeEventListener("resize", measurePill);
	}, [activePanel, isOpen, measurePill]);

	async function generate() {
		if (isBuilding) return;
		const trimmed = prompt.trim();
		if (!trimmed) {
			setPromptError(
				"Describe the form you want to create before generating it.",
			);
			return;
		}

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setPhase("building");
		setPromptError(null);
		try {
			// Templates keep their configured questions. Optional preferences must
			// not override the user's explicit requirements or expand basic requests.
			const preferences = /\btemplates?\b/i.test(trimmed)
				? []
				: [
						formType === "Survey" ? "Use a survey format." : null,
						formLength !== "Standard"
							? `Use a ${formLength.toLowerCase()} level of detail.`
							: null,
					].filter(Boolean);
			const generationPrompt = preferences.length
				? `${trimmed}\n\nOptional generation preferences (only when the request does not already specify the type, length, or field count):\n${preferences.join("\n")}`
				: trimmed;
			const response = await fetch("/api/generatewithai", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
				body: JSON.stringify({
					prompt: generationPrompt,
				}),
			});
			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as {
					error?: unknown;
				} | null;
				throw new Error(
					typeof body?.error === "string" && body.error
						? body.error
						: "Failed to generate form",
				);
			}
			const data = GeneratedFormResponseValidator.safeParse(
				await response.json(),
			);
			if (controller.signal.aborted) return;
			if (!data.success) {
				throw new Error("AI returned an invalid form structure");
			}
			// Built: apply straight into the builder and close. No interstitial.
			onGeneratedForm(data.data);
			setIsOpen(false);
			reset();
		} catch (error) {
			// Closed or restarted while in flight: nothing to report.
			if (controller.signal.aborted) return;
			setPhase("idle");
			setPromptError(errorMessage(error));
			toast.error(errorMessage(error));
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) {
					abortRef.current?.abort();
					reset();
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="relative w-full cursor-pointer" variant="secondary">
					<ShineBorder
						shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
						className="rounded-md"
					/>
					<Icons.Sparkles className="size-4 fill-white" />
					Generate with AI
				</Button>
			</DialogTrigger>
			{/* Centered on open, then top-pinned (see effect above): the prompt
			    bar and tabs never move, the dialog only grows/shrinks downward. */}
			<DialogContent
				data-ai-generation-dialog
				showCloseButton={false}
				className="!grid !translate-y-0 origin-center gap-0 overflow-hidden rounded-[20px] border border-[#272727] bg-[#0f0f0f] p-0 font-[Inter,system-ui,sans-serif] text-[#f4f4f2] shadow-[0_30px_90px_rgba(0,0,0,.4)] data-[state=open]:animate-none! data-[state=open]:transition-none! sm:max-w-[680px]"
				overlayClassName="bg-black/65 backdrop-blur-[7px] data-[state=open]:animate-none! data-[state=open]:transition-none!"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Generate with AI</DialogTitle>
					<DialogDescription>Generate a form with AI.</DialogDescription>
				</DialogHeader>

				<div className="mx-[14px] mt-[14px] rounded-[15px] bg-[#272727] p-[2px] transition-[background] duration-200 focus-within:bg-[conic-gradient(from_var(--ag-angle),#f5b301,#ff6a3d,#c14bff,#f5b301)] focus-within:animate-ag-rotate motion-reduce:transition-none motion-reduce:focus-within:animate-none">
					<div className="flex items-center gap-3 rounded-[13px] bg-[#0f0f0f] p-[13px_14px]">
						<span
							aria-hidden="true"
							className="animate-ag-pulse text-[18px] text-[#f5b301] motion-reduce:animate-none"
						>
							✦
						</span>
						<input
							aria-describedby={promptError ? errorId : undefined}
							aria-invalid={Boolean(promptError)}
							aria-label="Describe the form you want to build"
							className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#f4f4f2] outline-none placeholder:text-[#8d8b84] placeholder:opacity-100"
							disabled={isBuilding}
							id={promptId}
							placeholder={
								prompt ? "Describe the form you want to build…" : placeholder
							}
							value={prompt}
							onChange={(event) => {
								const value = event.target.value;
								setPrompt(value);
								setPromptError(null);
								// Un-highlight the card once the text no longer matches it
								setSelectedChoice((current) => {
									const choice = [...SUGGESTIONS, ...TEMPLATES].find(
										(t) => t.id === current,
									);
									return choice && choice.prompt === value ? current : null;
								});
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter" && !event.nativeEvent.isComposing) {
									event.preventDefault();
									generate();
								}
							}}
						/>
						<kbd className="rounded-[5px] border border-[#272727] bg-[#171717] px-[6px] py-[2px] font-medium text-[11px] leading-normal text-[#8d8b84]">
							esc
						</kbd>
					</div>
				</div>

				<div
					className="relative mx-[14px] mt-3 flex w-max max-w-[calc(100%-28px)] gap-1 rounded-full border border-[#272727] bg-[#171717] p-[3px]"
					role="tablist"
					aria-label="Generation modes"
					ref={modesRefCallback}
				>
					{(
						[
							["suggested", "✦ Suggested"],
							["templates", "▦ Templates"],
							["options", "⚙ Options"],
						] as const
					).map(([panel, label]) => (
						<button
							key={panel}
							className="rounded-full border-0 bg-transparent px-[14px] py-[7px] text-[13px] leading-[13px] text-[#8d8b84] transition-[color] duration-200 aria-[selected=true]:text-[#f4f4f2] hover:text-[#f4f4f2] motion-reduce:transition-none"
							role="tab"
							aria-selected={activePanel === panel}
							onClick={() => selectPanel(panel)}
							type="button"
						>
							<span className="relative z-[1]">{label}</span>
						</button>
					))}
					{pill && (
						<span
							aria-hidden="true"
							className="absolute top-[3px] bottom-[3px] rounded-full bg-[#0f0f0f] shadow-[0_1px_4px_rgba(0,0,0,.3),0_0_0_1px_#f5b301] transition-[left,width] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
							style={{ left: pill.left, width: pill.width }}
						/>
					)}
				</div>

				{/* Animated-height wrapper: it follows the measured height of .ag-body */}
				<motion.div
					animate={{ height: bodyHeight ?? "auto" }}
					className="relative overflow-hidden"
					initial={false}
					transition={panelTransition}
				>
					<div
						className="relative min-h-[293px] px-2 pt-[6px] pb-2"
						ref={pinTopRef}
					>
						<AnimatePresence
							custom={panelDirection}
							initial={false}
							mode="popLayout"
						>
							<motion.div
								animate="animate"
								className="ag-scrollpane max-h-[clamp(180px,calc(100dvh-320px),420px)] overflow-x-hidden overflow-y-auto overscroll-contain p-1.5 will-change-[transform,opacity,filter]"
								custom={panelDirection}
								exit="exit"
								initial="initial"
								key={activePanel}
								transition={panelTransition}
								variants={panelTransitionVariants}
							>
								{activePanel === "suggested" && (
									<div>
										<p className="mx-1 my-2 text-[11.5px] tracking-[.06em] text-[#8d8b84] uppercase">
											Suggested
										</p>
										{SUGGESTIONS.map((choice) => (
											<button
												className="group flex w-full items-center gap-3 rounded-[11px] border border-transparent bg-transparent p-[10px_12px] text-left text-sm text-[#f4f4f2] transition-[background_.22s_ease,transform_.28s_cubic-bezier(.16,1,.3,1),border-color_.22s_ease] aria-[pressed=true]:border-[#f5b301] aria-[pressed=true]:bg-[#171717] hover:bg-[#171717] hover:translate-x-1 motion-reduce:transition-none"
												key={choice.id}
												aria-pressed={selectedChoice === choice.id}
												disabled={isBuilding}
												onClick={() => selectChoice(choice)}
												type="button"
											>
												<i className="grid size-8 flex-none place-items-center rounded-[9px] bg-[rgba(245,179,1,.16)] text-[16px] not-italic transition-[transform_.25s] group-hover:-rotate-[8deg] group-hover:scale-[1.12] motion-reduce:transition-none">
													{choice.icon}
												</i>
												<span>
													{choice.title}
													<small className="block text-xs leading-[1.4] text-[#8d8b84]">
														{choice.description}
													</small>
												</span>
											</button>
										))}
									</div>
								)}
								{activePanel === "templates" && (
									<div>
										<div className="mx-1 mt-[2px] mb-3 flex gap-1.5 overflow-x-auto">
											{TEMPLATE_CATEGORIES.map((value) => (
												<button
													className="rounded-lg border-0 bg-transparent px-2.5 py-[5px] text-[13px] text-[#8d8b84] aria-[pressed=true]:bg-[#171717] aria-[pressed=true]:text-[#f4f4f2]"
													key={value}
													aria-pressed={category === value}
													onClick={() => setCategory(value)}
													type="button"
												>
													{value}
												</button>
											))}
										</div>
										<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
											{visibleTemplates.map((choice) => (
												<button
													className="group min-h-[142px] rounded-[14px] border border-[#272727] bg-[#171717] p-[14px] text-left text-[#f4f4f2] transition-[transform_.32s_cubic-bezier(.16,1,.3,1),border-color_.22s_ease,box-shadow_.32s_cubic-bezier(.16,1,.3,1)] aria-[pressed=true]:border-[#f5b301] aria-[pressed=true]:shadow-[0_0_0_3px_rgba(245,179,1,.16)] hover:-translate-y-1 hover:border-[#f5b301] hover:shadow-[0_10px_24px_rgba(0,0,0,.25)] motion-reduce:transition-none"
													key={choice.id}
													aria-pressed={selectedChoice === choice.id}
													disabled={isBuilding}
													onClick={() => selectChoice(choice)}
													type="button"
												>
													<i className="grid size-8 flex-none place-items-center rounded-[9px] bg-[rgba(245,179,1,.16)] text-[16px] not-italic transition-[transform_.25s] group-hover:-rotate-[8deg] group-hover:scale-[1.12] motion-reduce:transition-none">
														{choice.icon}
													</i>
													<b className="mt-[10px] mb-[3px] block text-[13.5px]">
														{choice.title}
													</b>
													<small className="block text-xs leading-[1.4] text-[#8d8b84]">
														{choice.description}
													</small>
													<span className="mt-2 inline-block rounded-full border border-[#272727] px-2 py-[2px] text-[11px] text-[#8d8b84]">
														{choice.fields}
													</span>
												</button>
											))}
										</div>
									</div>
								)}
								{activePanel === "options" && (
									<div>
										<div className="flex items-center justify-between gap-2.5 rounded-[11px] p-[11px_12px] text-sm text-[#f4f4f2] transition-[background_.15s] hover:bg-[#171717] motion-reduce:transition-none">
											<span>
												Type
												<small className="block text-xs leading-[1.4] text-[#8d8b84]">
													What kind of form to generate
												</small>
											</span>
											<div className="inline-flex rounded-[10px] border border-[#272727] bg-[#171717] p-[3px]">
												{["Form", "Survey"].map((value) => (
													<button
														className="rounded-lg border-0 bg-transparent px-3 py-1.5 text-[13px] text-[#8d8b84] aria-[pressed=true]:bg-[#0f0f0f] aria-[pressed=true]:text-[#f4f4f2] aria-[pressed=true]:shadow-[0_1px_3px_rgba(0,0,0,.25)]"
														key={value}
														aria-pressed={formType === value}
														onClick={() => setFormType(value)}
														type="button"
													>
														{value}
													</button>
												))}
											</div>
										</div>
										<div className="flex items-center justify-between gap-2.5 rounded-[11px] p-[11px_12px] text-sm text-[#f4f4f2] transition-[background_.15s] hover:bg-[#171717] motion-reduce:transition-none">
											<span>
												Length
												<small className="block text-xs leading-[1.4] text-[#8d8b84]">
													How many fields to include
												</small>
											</span>
											<div className="inline-flex rounded-[10px] border border-[#272727] bg-[#171717] p-[3px]">
												{["Short", "Standard", "Detailed"].map((value) => (
													<button
														className="rounded-lg border-0 bg-transparent px-3 py-1.5 text-[13px] text-[#8d8b84] aria-[pressed=true]:bg-[#0f0f0f] aria-[pressed=true]:text-[#f4f4f2] aria-[pressed=true]:shadow-[0_1px_3px_rgba(0,0,0,.25)]"
														key={value}
														aria-pressed={formLength === value}
														onClick={() => setFormLength(value)}
														type="button"
													>
														{value}
													</button>
												))}
											</div>
										</div>
									</div>
								)}
							</motion.div>
						</AnimatePresence>
						{promptError && (
							<p
								className="mt-2 text-sm text-red-400"
								id={errorId}
								role="alert"
							>
								{promptError}
							</p>
						)}
					</div>
				</motion.div>

				<div className="flex items-center gap-4 border-t border-[#272727] bg-[#0f0f0f] py-[11px] pr-[14px] pl-[18px] text-xs text-[#8d8b84]">
					<span className="max-[520px]:hidden">
						<kbd className="rounded-[5px] border border-[#272727] bg-[#171717] px-[6px] py-[2px] font-medium text-[11px] leading-normal text-[#8d8b84]">
							↵
						</kbd>{" "}
						generate
					</span>
					<span className="max-[520px]:hidden">
						AI can make mistakes. Everything stays editable.
					</span>
					<button
						className="relative ml-auto overflow-hidden rounded-[10px] border-0 bg-[#f5b301] px-[15px] py-[9px] text-[13.5px] font-semibold text-[#1a1200] transition-[transform_.15s,opacity_.2s] after:absolute after:inset-0 after:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.55)_50%,transparent_70%)] after:bg-[length:200%_100%] after:bg-[position:150%_0] after:opacity-0 after:transition-[opacity_.24s_ease] after:content-[''] enabled:hover:-translate-y-px enabled:active:scale-[.96] enabled:hover:after:opacity-100 enabled:hover:after:animate-ag-shim-fast disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:after:transition-none motion-reduce:enabled:hover:after:animate-none"
						disabled={isBuilding || !prompt.trim()}
						onClick={generate}
						type="button"
					>
						Generate
					</button>
				</div>

				<AnimatePresence mode="popLayout">
					{phase === "building" && (
						<motion.div
							animate="animate"
							className="absolute inset-0 flex flex-col overflow-hidden bg-[#0f0f0f] p-[26px]"
							style={{
								position: "absolute",
								inset: 0,
								zIndex: 10,
								background: "#0f0f0f",
							}}
							exit="exit"
							initial="initial"
							key="building"
							transition={overlayTransition}
							variants={overlayVariants}
						>
							<div className="flex items-center gap-3 text-[15px] font-semibold">
								<span className="size-4 animate-ag-spin rounded-full border-2 border-[#272727] border-t-[#f5b301] motion-reduce:animate-none" />
								{BUILD_STEPS[buildStep]}
							</div>
							<div className="my-4 mb-5 h-1 overflow-hidden rounded-[9px] bg-[#171717]">
								<i className="block h-full w-[72%] animate-ag-shim bg-[linear-gradient(90deg,#f5b301,#ff6a3d,#c14bff)] motion-reduce:animate-none" />
							</div>
							<div className="grid gap-3.5">
								<div className="h-9 animate-ag-shim rounded-[10px] border border-[#272727] bg-[linear-gradient(90deg,#171717_25%,#272727_50%,#171717_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
								<div className="h-9 animate-ag-shim rounded-[10px] border border-[#272727] bg-[linear-gradient(90deg,#171717_25%,#272727_50%,#171717_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
								<div className="h-9 animate-ag-shim rounded-[10px] border border-[#272727] bg-[linear-gradient(90deg,#171717_25%,#272727_50%,#171717_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
								<div className="h-[70px] animate-ag-shim rounded-[10px] border border-[#272727] bg-[linear-gradient(90deg,#171717_25%,#272727_50%,#171717_75%)] bg-[length:200%_100%] motion-reduce:animate-none" />
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	);
};

export default GenerateWithAiPrompt;
