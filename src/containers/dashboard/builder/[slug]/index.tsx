import { KeyboardSensor, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import axios from "axios";
import { useReducedMotion, type Variants } from "motion/react";
import type { ComponentType } from "react";
import {
	createElement,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	BuilderCanvasPanel,
	type BuilderCanvasView,
} from "#/containers/dashboard/builder/[slug]/components/builder-canvas-panel";
import { BuilderDragOverlay } from "#/containers/dashboard/builder/[slug]/components/builder-drag-overlay";
import { BuilderHeader } from "#/containers/dashboard/builder/[slug]/components/builder-header";
import { BuilderLeftSidebar } from "#/containers/dashboard/builder/[slug]/components/builder-left-sidebar";
import { BuilderRightSidebar } from "#/containers/dashboard/builder/[slug]/components/builder-right-sidebar";
import type { FormCustomizationValue } from "#/containers/dashboard/builder/[slug]/components/form-customization";
import { SaveFormLoginDialog } from "#/containers/dashboard/builder/[slug]/components/save-form-login-dialog";
import { SectionEditor } from "#/containers/dashboard/builder/[slug]/components/section-editor";
import {
	SuccessBlockEditor,
	type SuccessPageSettings,
} from "#/containers/dashboard/builder/[slug]/components/success-page-blocks";
import {
	createImportedGoogleFormStructure,
	createPage,
	type FormPage,
	type FormStructure,
	fieldCount,
	getPage,
	updateField,
	updateSection,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import { useBuilderDrag } from "#/containers/dashboard/builder/[slug]/hooks/use-builder-drag";
import {
	type EditingField,
	type EditingSection,
	useStructureActions,
} from "#/containers/dashboard/builder/[slug]/hooks/use-structure-actions";
import { getTemplateBySlug } from "#/containers/dashboard/templates/constants";
import { instantiateTemplate } from "#/containers/dashboard/templates/instantiate-template";
import { IMMORTAL_SENTINEL_DATE } from "#/features/form-builder/components/date-picker-with-presets";
import { useFormThemeFonts } from "#/features/form-builder/components/form-theme-scope";
import type { GeneratedForm } from "#/features/form-builder/core/generated-form";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	getOrderedFormFields,
	isFormStructure,
	type FormStructure as PersistedFormStructure,
	type QuizSettings,
} from "#/features/form-builder/form-structure";
import { useFormStore } from "#/features/form-builder/store";
import { normalizeFormTheme } from "#/features/form-builder/theme";
import type { QuizQuestionConfig } from "#/features/form-builder/types";
import { getFieldEditor } from "#/features/form-builder/utils/helperFunctions";
import type { ImportedGoogleFormPage } from "#/features/google-forms-import/types";
import { GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM } from "#/features/google-sheets/constants";
import { googleSheetsOAuthResultMessage } from "#/features/google-sheets/oauth-result";
import { authClient } from "#/lib/auth-client";
import {
	type CreateFormPayload,
	normalizeSuccessBlockOrder,
	normalizeSuccessExtraButtons,
	type SuccessBlockId,
} from "#/lib/validators/form";

// Matches the Sheet close animation (`data-[state=closed]:duration-300` in
// components/ui/sheet.tsx). The field editor stays mounted for this long after
// closing so Radix can play the exit animation before React unmounts it.
const FIELD_EDITOR_CLOSE_ANIMATION_MS = 300;

const sensors = [
	PointerSensor.configure({
		activatorElements(source) {
			return [source.element, source.handle];
		},
	}),
	KeyboardSensor,
];

type FieldEditorComponent = ComponentType<{
	field: FieldConfig;
	onUpdate: (field: FieldConfig) => void;
	onClose: () => void;
	isOpen: boolean;
	formId?: string;
	isPersisted?: boolean;
}>;

function FieldEditor({
	field,
	onUpdate,
	onClose,
	isOpen,
	formId,
	isPersisted,
}: {
	field: FieldConfig;
	onUpdate: (field: FieldConfig) => void;
	onClose: () => void;
	isOpen: boolean;
	formId?: string;
	isPersisted?: boolean;
}) {
	const EditorComponent = getFieldEditor(
		field.uniqueIdentifier,
	) as unknown as FieldEditorComponent;

	return createElement(EditorComponent, {
		field,
		onUpdate,
		onClose,
		isOpen,
		formId,
		isPersisted,
	});
}

function createInitialState() {
	const firstPage = createPage();

	return {
		activePageId: firstPage.id,
		formStructure: { pages: [firstPage] } satisfies FormStructure,
	};
}

// Stable fallback for unreachable empty-pages state (see activePage below).
// Module scope keeps hook deps stable; never written, only read.
const EMPTY_PAGE_FALLBACK: FormPage = { id: "", sections: [] };

export default function BuilderPage({ slug }: { slug: string }) {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center text-muted-foreground">
					Loading builder...
				</div>
			}
		>
			<BuilderContent key={slug} paramFormId={slug} />
		</Suspense>
	);
}

function BuilderContent({ paramFormId }: { paramFormId: string }) {
	const initialState = useState(createInitialState)[0];
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as Record<
		string,
		string | undefined
	>;
	const templateSlug = search.template;
	const googleSheetsResult = search[GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM];
	const { formSettings, setFormSettings } = useFormStore();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [currentFormId, setCurrentFormId] = useState(paramFormId);
	const [activePageId, setActivePageId] = useState(initialState.activePageId);
	const [editingField, setEditingField] = useState<EditingField | null>(null);
	// Controls the editor Sheet's `open` prop separately from `editingField` so
	// the close animation can play: closing flips this to false first and only
	// unmounts (clears `editingField`) after the animation finishes.
	const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
	const fieldEditorCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const openFieldEditor = useCallback((editing: EditingField) => {
		if (fieldEditorCloseTimer.current !== null) {
			clearTimeout(fieldEditorCloseTimer.current);
			fieldEditorCloseTimer.current = null;
		}
		setEditingField(editing);
		setIsFieldEditorOpen(true);
	}, []);

	const closeFieldEditor = useCallback(() => {
		setIsFieldEditorOpen(false);
		if (fieldEditorCloseTimer.current !== null) {
			clearTimeout(fieldEditorCloseTimer.current);
		}
		fieldEditorCloseTimer.current = setTimeout(() => {
			setEditingField(null);
			fieldEditorCloseTimer.current = null;
		}, FIELD_EDITOR_CLOSE_ANIMATION_MS);
	}, []);

	useEffect(() => {
		return () => {
			if (fieldEditorCloseTimer.current !== null) {
				clearTimeout(fieldEditorCloseTimer.current);
			}
		};
	}, []);
	const [editingSection, setEditingSection] = useState<EditingSection | null>(
		null,
	);
	const [formStructure, setFormStructure] = useState<FormStructure>(
		initialState.formStructure,
	);
	const [customization, setCustomization] =
		useState<FormCustomizationValue | null>(null);
	const customizationSession = useRef(0);
	const customizationSessionId = customizationSession.current;
	const mode = customization ? "customise" : "builder";
	const canvasTheme = customization ? customization.theme : formStructure.theme;
	const canvasLayout = customization
		? customization.layout
		: formStructure.layout;
	const canvasSubmitButtonText =
		(customization
			? customization.submitButtonText
			: formSettings.submitButtonText
		)?.trim() || undefined;
	// Success content edits apply directly like the form title, while theme
	// and layout stay in the customization draft until applied.
	const successSettings: SuccessPageSettings = {
		redirectUrl: formSettings.redirectUrl?.trim() || undefined,
		title: formSettings.successTitle ?? "",
		message: formSettings.successMessage ?? "",
		blockOrder: normalizeSuccessBlockOrder(formSettings.successBlockOrder),
		submitAnotherResponseText: formSettings.submitAnotherResponseText ?? "",
		returnToHomepageText: formSettings.returnToHomepageText ?? "",
		showSubmitAnotherResponse: formSettings.showSubmitAnotherResponse ?? true,
		showReturnToHomepage: formSettings.showReturnToHomepage ?? true,
		extraButtons: formSettings.successExtraButtons ?? [],
	};
	const [canvasView, setCanvasView] = useState<BuilderCanvasView>("form");
	const [editingSuccessBlock, setEditingSuccessBlock] =
		useState<SuccessBlockId | null>(null);
	useFormThemeFonts(canvasTheme);

	const pageTransitionDirection = useRef(0);
	const closeCustomization = () => {
		pageTransitionDirection.current = -1;
		setCanvasView("form");
		setCustomization(null);
	};
	const applyCustomization = () => {
		if (!customization) return;
		setFormStructure((current) => ({
			...current,
			theme: customization.theme,
			layout: customization.layout,
		}));
		setFormSettings({
			...formSettings,
			submitButtonText: customization.submitButtonText?.trim() || undefined,
		});
		closeCustomization();
	};
	const customizationProps = customization
		? {
				value: customization,
				onUpdate: (value: Partial<FormCustomizationValue>) =>
					setCustomization((current) =>
						current && customizationSession.current === customizationSessionId
							? { ...current, ...value }
							: current,
					),
				onApply: () => {
					applyCustomization();
					toast.success("Customization applied. Save your form to keep it.");
				},
				onCancel: closeCustomization,
				onReset: () => {
					setCustomization({
						theme: undefined,
						layout: undefined,
						submitButtonText: undefined,
					});
				},
			}
		: null;
	const [isSaving, setIsSaving] = useState(false);
	const [isSaveLoginOpen, setIsSaveLoginOpen] = useState(false);
	const [hasInvalidPersistedStructure, setHasInvalidPersistedStructure] =
		useState(false);
	const [canvasWidth, setCanvasWidth] = useState<number | null>(null);

	const canvasRef = useRef<HTMLDivElement | null>(null);
	const canvasObserverRef = useRef<ResizeObserver | null>(null);

	const isExistingForm = currentFormId !== "new-form";
	const isNewForm = !isExistingForm;

	useEffect(() => {
		if (!googleSheetsResult) return;

		const result = googleSheetsOAuthResultMessage(googleSheetsResult);
		toast[result.type](result.message);

		const nextSearch = { ...search };
		delete nextSearch[GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM];
		void navigate({ to: ".", search: nextSearch, replace: true });
	}, [googleSheetsResult, navigate, search]);

	const activePage =
		getPage(formStructure, activePageId) ??
		formStructure.pages[0] ??
		EMPTY_PAGE_FALLBACK;
	const resolvedActivePageId = activePage.id;
	const hasCanvasSections = activePage.sections.length > 0;
	const shouldReduceMotion = useReducedMotion();
	const activePageIndex = formStructure.pages.findIndex(
		(page) => page.id === resolvedActivePageId,
	);

	const selectPage = useCallback(
		(pageId: string) => {
			const nextIndex = formStructure.pages.findIndex(
				(page) => page.id === pageId,
			);
			if (
				nextIndex !== -1 &&
				activePageIndex !== -1 &&
				nextIndex !== activePageIndex
			) {
				pageTransitionDirection.current = nextIndex > activePageIndex ? 1 : -1;
			}
			setActivePageId(pageId);
		},
		[formStructure.pages, activePageIndex],
	);

	const pageTransitionVariants: Variants = {
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
	const pageTransition = shouldReduceMotion
		? { duration: 0.15 }
		: {
				type: "spring" as const,
				stiffness: 400,
				damping: 35,
				mass: 0.8,
			};
	const sidebarDirection = pageTransitionDirection.current;

	const openCustomization = useCallback(() => {
		pageTransitionDirection.current = 1;
		customizationSession.current += 1;
		setCustomization({
			theme: formStructure.theme
				? normalizeFormTheme(formStructure.theme)
				: undefined,
			layout: formStructure.layout,
			submitButtonText: formSettings.submitButtonText,
		});
	}, [
		formStructure.theme,
		formStructure.layout,
		formSettings.submitButtonText,
	]);

	const moveSuccessBlock = useCallback(
		(block: SuccessBlockId, direction: -1 | 1) => {
			const order = normalizeSuccessBlockOrder(formSettings.successBlockOrder);
			const index = order.indexOf(block);
			const next = index + direction;
			if (index === -1 || next < 0 || next >= order.length) return;
			const updated = [...order];
			[updated[index], updated[next]] = [updated[next], updated[index]];
			setFormSettings({ ...formSettings, successBlockOrder: updated });
		},
		[formSettings, setFormSettings],
	);

	const reorderSuccessBlocks = useCallback(
		(blockOrder: SuccessBlockId[]) => {
			setFormSettings({ ...formSettings, successBlockOrder: blockOrder });
		},
		[formSettings, setFormSettings],
	);

	const registerCanvas = useCallback((element: HTMLDivElement | null) => {
		if (!element) {
			// A null detach can come from an exiting (superseded) canvas that
			// unmounts after the new canvas attached. Never kill the live
			// observer here; full unmount is handled by the effect cleanup below.
			return;
		}

		canvasObserverRef.current?.disconnect();
		canvasObserverRef.current = null;
		canvasRef.current = element;

		const updateCanvasWidth = () => {
			setCanvasWidth(element.clientWidth);
		};

		updateCanvasWidth();
		const observer = new ResizeObserver(updateCanvasWidth);
		observer.observe(element);
		canvasObserverRef.current = observer;
	}, []);

	const {
		fieldOverlayWidth,
		handleDragEnd,
		handleDragOver,
		handleDragStart,
		paletteFieldClone,
		paletteFieldPlaceholderId,
		paletteSectionClone,
		paletteSectionPlaceholderId,
		registerFieldSurface,
	} = useBuilderDrag({
		activePage,
		formStructure,
		resolvedActivePageId,
		setFormStructure,
	});

	useEffect(() => {
		// Re-sync after StrictMode's mount → unmount → remount cycle in dev,
		// which runs the cleanup below without re-invoking the canvas ref.
		const node = canvasRef.current;
		if (node && !canvasObserverRef.current) {
			registerCanvas(node);
		}

		return () => {
			canvasObserverRef.current?.disconnect();
			canvasObserverRef.current = null;
		};
	}, [registerCanvas]);

	const form = useQuery({
		queryKey: ["form", currentFormId],
		queryFn: async () => {
			const { data } = await axios.get(`/api/forms/${currentFormId}`);
			return data;
		},
		enabled: isExistingForm,
		retry: false,
		retryOnMount: false,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
	const refetchForm = form.refetch;

	useEffect(() => {
		if (!isExistingForm) return;

		if (form.isError) {
			toast.error("Failed to load form");
			return;
		}

		if (!form.isSuccess || !form.data) return;

		if (!isFormStructure(form.data.fields)) {
			setHasInvalidPersistedStructure(true);
			toast.error("Form structure is invalid");
			return;
		}

		setHasInvalidPersistedStructure(false);
		setFormSettings({
			...formSettings,
			title: form.data.title,
			description: form.data.description,
			expiresAt: form.data.expiresAt
				? new Date(form.data.expiresAt)
				: IMMORTAL_SENTINEL_DATE,
			maxSubmissions: form.data.maxSubmissions,
			redirectUrl: form.data.redirectUrl,
			submitButtonText: form.data.submitButtonText,
			submitAnotherResponseText: form.data.submitAnotherResponseText,
			returnToHomepageText: form.data.returnToHomepageText,
			showSubmitAnotherResponse: form.data.showSubmitAnotherResponse,
			showReturnToHomepage: form.data.showReturnToHomepage,
			successExtraButtons: normalizeSuccessExtraButtons(
				form.data.successExtraButtons,
			),
			successTitle: form.data.successTitle,
			successMessage: form.data.successMessage,
			successBlockOrder: normalizeSuccessBlockOrder(
				form.data.successBlockOrder,
			),
		});
		setFormStructure({
			...(form.data.fields as PersistedFormStructure),
			theme: form.data.fields.theme
				? normalizeFormTheme(form.data.fields.theme)
				: undefined,
		});
		setActivePageId(form.data.fields.pages[0]?.id ?? initialState.activePageId);
		// Hydration is intentionally driven by the query result, not the store
		// writes performed inside this effect.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isExistingForm, form.data, form.isError, form.isSuccess]);

	useEffect(() => {
		if (!isNewForm || !templateSlug) return;

		const template = getTemplateBySlug(templateSlug);
		if (!template) {
			toast.error("Template not found");
			return;
		}

		const structure = instantiateTemplate(template);
		setFormStructure(structure);
		setActivePageId(structure.pages[0]?.id ?? initialState.activePageId);
		setFormSettings({
			...formSettings,
			title: template.title,
			description: template.description,
			submitButtonText: template.submitButtonText,
		});
		toast.success(`Loaded template: ${template.title}`);
		// A template is an initialization input: apply it once per template URL.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isNewForm, templateSlug]);

	const {
		addField,
		addPage,
		addSection,
		removeFieldById,
		removePageById,
		removeSectionById,
	} = useStructureActions({
		formStructure,
		resolvedActivePageId,
		setActivePageId,
		setEditingField,
		setEditingSection,
		setFormStructure,
		transitionRef: pageTransitionDirection,
	});

	const replaceWithImportedPages = useCallback(
		(
			title: string,
			description: string,
			importedPages: ImportedGoogleFormPage[],
		) => {
			// Sanitize imported Google fields before they enter builder state.
			const structure = createImportedGoogleFormStructure(importedPages);
			if (fieldCount(structure) === 0) {
				toast.error("Import produced no usable fields");
				return;
			}
			setFormStructure((current) => ({ ...structure, theme: current.theme }));
			setActivePageId(structure.pages[0].id);
			setFormSettings({ ...formSettings, title, description });
		},
		[formSettings, setFormSettings],
	);

	const replaceWithGeneratedForm = useCallback(
		({ title, description, fields, submitButtonText }: GeneratedForm) => {
			if (!isFormStructure(fields) || fieldCount(fields) === 0) {
				toast.error("Generation produced no valid form structure");
				return;
			}
			setFormStructure((current) => ({ ...fields, theme: current.theme }));
			setActivePageId(fields.pages[0].id);
			setFormSettings({
				...formSettings,
				title,
				description: description ?? "",
				submitButtonText: submitButtonText ?? formSettings.submitButtonText,
			});
		},
		[formSettings, setFormSettings],
	);

	const updateQuizSettings = useCallback((quiz: QuizSettings | undefined) => {
		setFormStructure((current) => ({ ...current, quiz }));
	}, []);

	const updateQuizQuestion = useCallback(
		(fieldId: string, quiz: QuizQuestionConfig | undefined) => {
			setFormStructure((current) => ({
				...current,
				pages: current.pages.map((page) => ({
					...page,
					sections: page.sections.map((section) => ({
						...section,
						fields: section.fields.map((field) =>
							field.id === fieldId
								? ({ ...field, quiz } as FieldConfig)
								: field,
						),
					})),
				})),
			}));
		},
		[],
	);

	const handleSaveForm = useCallback(
		async (afterSignIn = false) => {
			if (!afterSignIn) {
				if (isSessionPending) {
					toast.message("Checking your sign-in status…");
					return;
				}
				if (!session?.user) {
					setIsSaveLoginOpen(true);
					return;
				}
			}

			if (hasInvalidPersistedStructure) {
				toast.error("Fix the form structure before saving");
				return;
			}

			if (!formSettings.title.trim()) {
				toast.error("Form name is required");
				return;
			}

			if (fieldCount(formStructure) === 0) {
				toast.error("Add at least one field before saving");
				return;
			}

			setIsSaving(true);
			try {
				// Fully blank extra rows are abandoned drafts, not buttons.
				// Partially filled rows stay for the validator to reject loudly.
				const extraButtonsToSave = (
					formSettings.successExtraButtons ?? []
				).filter((button) => button.label.trim() || button.url.trim());
				const payload: CreateFormPayload = {
					title: formSettings.title,
					description: formSettings.description?.trim() || null,
					fields: {
						...formStructure,
						theme: canvasTheme,
						layout: canvasLayout,
					},
					maxSubmissions: formSettings.maxSubmissions
						? Number.isNaN(formSettings.maxSubmissions)
							? null
							: formSettings.maxSubmissions
						: null,
					expiresAt: formSettings.expiresAt,
					redirectUrl: formSettings.redirectUrl?.trim() || null,
					submitButtonText: canvasSubmitButtonText?.trim() || null,
					submitAnotherResponseText:
						formSettings.submitAnotherResponseText?.trim() || null,
					returnToHomepageText:
						formSettings.returnToHomepageText?.trim() || null,
					showSubmitAnotherResponse: formSettings.showSubmitAnotherResponse,
					showReturnToHomepage: formSettings.showReturnToHomepage,
					successExtraButtons:
						extraButtonsToSave.length > 0 ? extraButtonsToSave : null,
					successTitle: formSettings.successTitle?.trim() || null,
					successMessage: formSettings.successMessage?.trim() || null,
					successBlockOrder: formSettings.successBlockOrder ?? null,
				};
				if (isNewForm) {
					const { data } = await axios.post("/api/forms/new", payload);
					setCurrentFormId(data.id);
					window.history.replaceState(
						null,
						"",
						`/dashboard/builder/${data.id}`,
					);
					toast.success("Form created successfully");
				} else {
					await axios.post(`/api/forms/${currentFormId}/update`, payload);
					await refetchForm();
					toast.success("Form updated successfully");
				}
			} catch (error) {
				if (axios.isAxiosError(error) && error.response?.status === 422) {
					const issues = error.response.data?.issues as
						| { field: string; message: string }[]
						| undefined;
					toast.error("Validation error", {
						description: issues?.length
							? issues
									.map((issue) => `• ${issue.field}: ${issue.message}`)
									.join("\n")
							: "Please check your form fields and try again.",
						style: { whiteSpace: "pre-line" },
					});
					return;
				}

				toast.error(
					isNewForm ? "Failed to create form" : "Failed to update form",
				);
			} finally {
				setIsSaving(false);
			}
		},
		[
			canvasTheme,
			canvasLayout,
			canvasSubmitButtonText,
			currentFormId,
			formSettings,
			formStructure,
			hasInvalidPersistedStructure,
			isNewForm,
			refetchForm,
			isSessionPending,
			session?.user,
		],
	);

	return (
		<DragDropProvider
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
		>
			<div className="flex h-screen min-w-0 bg-background text-foreground">
				<BuilderLeftSidebar
					currentFormId={currentFormId}
					customizationProps={customizationProps}
					customizationSessionId={customizationSessionId}
					formStructure={formStructure}
					isExistingForm={isExistingForm}
					mode={mode}
					pageTransition={pageTransition}
					pageTransitionVariants={pageTransitionVariants}
					sidebarDirection={sidebarDirection}
					onQuizSettingsChange={updateQuizSettings}
					onQuizQuestionChange={updateQuizQuestion}
					replaceWithGeneratedForm={replaceWithGeneratedForm}
					replaceWithImportedPages={replaceWithImportedPages}
				/>

				<ScrollArea className="sticky flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-card [&_[data-radix-scroll-area-viewport]>div]:!flex [&_[data-radix-scroll-area-viewport]>div]:h-full [&_[data-radix-scroll-area-viewport]>div]:w-full [&_[data-radix-scroll-area-viewport]>div]:min-h-0 [&_[data-radix-scroll-area-viewport]>div]:flex-col">
					<BuilderHeader
						currentFormId={currentFormId}
						customizing={Boolean(customization)}
						isExistingForm={isExistingForm}
						isSaving={isSaving}
						saveDisabled={hasInvalidPersistedStructure}
						onSave={() => {
							if (customization) applyCustomization();
							void handleSaveForm();
						}}
						onToggleCustomize={() => {
							if (customization) applyCustomization();
							else openCustomization();
						}}
					/>

					<BuilderCanvasPanel
						activePage={activePage}
						activePageId={resolvedActivePageId}
						activeTabBackground={
							canvasTheme
								? normalizeFormTheme(canvasTheme).colors.background
								: undefined
						}
						canvasLayout={canvasLayout}
						canvasSubmitButtonText={canvasSubmitButtonText}
						canvasTheme={canvasTheme}
						canvasView={canvasView}
						successSettings={successSettings}
						canRemovePage={formStructure.pages.length > 1}
						description={formSettings.description}
						hasCanvasSections={hasCanvasSections}
						isCustomizing={Boolean(customization)}
						pages={formStructure.pages}
						pageTransition={pageTransition}
						pageTransitionDirection={pageTransitionDirection.current}
						pageTransitionVariants={pageTransitionVariants}
						paletteFieldPlaceholderId={paletteFieldPlaceholderId}
						paletteSectionPlaceholderId={paletteSectionPlaceholderId}
						title={formSettings.title}
						onAddPage={() => {
							setCanvasView("form");
							addPage();
						}}
						onAddSection={addSection}
						onCanvasViewChange={setCanvasView}
						onEditField={(field, sectionId) =>
							openFieldEditor({
								field,
								pageId: resolvedActivePageId,
								sectionId,
							})
						}
						onEditSection={(section) =>
							setEditingSection({
								pageId: resolvedActivePageId,
								section,
							})
						}
						onEditSuccessBlock={setEditingSuccessBlock}
						onMoveSuccessBlock={moveSuccessBlock}
						onReorderSuccessBlocks={reorderSuccessBlocks}
						onFieldSurfaceRef={registerFieldSurface}
						onCanvasRef={registerCanvas}
						onRemoveField={removeFieldById}
						onRemovePage={removePageById}
						onRemoveSection={removeSectionById}
						onSelectPage={(pageId) => {
							setCanvasView("form");
							selectPage(pageId);
						}}
					/>
				</ScrollArea>

				<BuilderRightSidebar
					customizationProps={customizationProps}
					customizationSessionId={customizationSessionId}
					mode={mode}
					pageTransition={pageTransition}
					pageTransitionVariants={pageTransitionVariants}
					sidebarDirection={sidebarDirection}
					onAddField={addField}
					onAddSection={addSection}
				/>
			</div>

			<BuilderDragOverlay
				activePage={activePage}
				canvasWidth={canvasWidth}
				fieldOverlayWidth={fieldOverlayWidth}
				layout={canvasLayout}
				paletteFieldRef={paletteFieldClone}
				paletteSectionRef={paletteSectionClone}
				theme={canvasTheme}
			/>

			{editingField ? (
				<FieldEditor
					// Remount per field so the editor draft (`useState(field)`) never
					// shows a previous field's values when switching fields.
					key={editingField.field.id}
					field={editingField.field}
					isOpen={isFieldEditorOpen}
					onUpdate={(field) => {
						setFormStructure((prev) =>
							updateField(
								prev,
								editingField.pageId,
								editingField.sectionId,
								field,
							),
						);
						closeFieldEditor();
					}}
					onClose={closeFieldEditor}
					formId={isExistingForm ? currentFormId : undefined}
					isPersisted={Boolean(
						form.data &&
							isFormStructure(form.data.fields) &&
							getOrderedFormFields(form.data.fields).some(
								(field) => field.id === editingField.field.id,
							),
					)}
				/>
			) : null}

			<SaveFormLoginDialog
				open={isSaveLoginOpen}
				onOpenChange={setIsSaveLoginOpen}
				onSignedIn={() => void handleSaveForm(true)}
			/>

			{editingSection ? (
				<SectionEditor
					section={editingSection.section}
					onUpdate={(section) => {
						setFormStructure((prev) =>
							updateSection(prev, editingSection.pageId, section),
						);
						setEditingSection(null);
					}}
					onClose={() => setEditingSection(null)}
				/>
			) : null}

			{editingSuccessBlock ? (
				<SuccessBlockEditor
					block={editingSuccessBlock}
					settings={successSettings}
					onUpdate={(update) => {
						const next = { ...formSettings };
						if (update.title !== undefined)
							next.successTitle = update.title || undefined;
						if (update.message !== undefined)
							next.successMessage = update.message || undefined;
						if (update.submitAnotherResponseText !== undefined)
							next.submitAnotherResponseText =
								update.submitAnotherResponseText.trim() || undefined;
						if (update.returnToHomepageText !== undefined)
							next.returnToHomepageText =
								update.returnToHomepageText.trim() || undefined;
						if (update.showSubmitAnotherResponse !== undefined)
							next.showSubmitAnotherResponse = update.showSubmitAnotherResponse;
						if (update.showReturnToHomepage !== undefined)
							next.showReturnToHomepage = update.showReturnToHomepage;
						if (update.extraButtons !== undefined)
							next.successExtraButtons = update.extraButtons;
						setFormSettings(next);
						setEditingSuccessBlock(null);
					}}
					onClose={() => setEditingSuccessBlock(null)}
				/>
			) : null}
		</DragDropProvider>
	);
}
