import { move } from "@dnd-kit/helpers";
import {
	DragDropProvider,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "motion/react";
import { useRef } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { BuilderCanvas } from "#/containers/dashboard/builder/[slug]/components/builder-canvas";
import { ChromeTabStrip } from "#/containers/dashboard/builder/[slug]/components/chrome-tab-strip";
import {
	SortableSuccessBlock,
	SUCCESS_BLOCK_LABELS,
	SuccessBlockOverlayContent,
	type SuccessPageSettings,
	successBlockSensors,
} from "#/containers/dashboard/builder/[slug]/components/success-page-blocks";
import type { FormStructure } from "#/containers/dashboard/builder/[slug]/drag-model";
import { FormSubmittedPage } from "#/features/form-builder/components/form-submitted-page";
import type { FieldConfig } from "#/features/form-builder/elements";
import type {
	FormLayout,
	FormPage,
} from "#/features/form-builder/form-structure";
import { getFormThemeStyle } from "#/features/form-builder/theme";
import { cn } from "#/lib/utils";
import type { SuccessBlockId } from "#/lib/validators/form";

export type BuilderCanvasView = "form" | "success";

interface BuilderCanvasPanelProps {
	activePage: FormPage;
	activePageId: string;
	activeTabBackground: string | undefined;
	canvasLayout: FormLayout | undefined;
	canvasSubmitButtonText: string | undefined;
	canvasTheme: FormStructure["theme"];
	canvasView: BuilderCanvasView;
	successSettings: SuccessPageSettings;
	canRemovePage: boolean;
	description: string | undefined;
	hasCanvasSections: boolean;
	isCustomizing: boolean;
	pages: FormPage[];
	pageTransition: Transition;
	pageTransitionDirection: number;
	pageTransitionVariants: Variants;
	paletteFieldPlaceholderId: string | null;
	paletteSectionPlaceholderId: string | null;
	title: string;
	onAddPage: () => void;
	onAddSection: () => void;
	onCanvasViewChange: (view: BuilderCanvasView) => void;
	onEditField: (field: FieldConfig, sectionId: string) => void;
	onEditSection: (section: FormPage["sections"][number]) => void;
	onEditSuccessBlock: (block: SuccessBlockId) => void;
	onMoveSuccessBlock: (block: SuccessBlockId, direction: -1 | 1) => void;
	onReorderSuccessBlocks: (blockOrder: SuccessBlockId[]) => void;
	onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void;
	onCanvasRef: (element: HTMLDivElement | null) => void;
	onRemoveField: (sectionId: string, fieldId: string) => void;
	onRemovePage: (pageId: string) => void;
	onRemoveSection: (sectionId: string) => void;
	onSelectPage: (pageId: string) => void;
}

export function BuilderCanvasPanel({
	activePage,
	activePageId,
	activeTabBackground,
	canvasLayout,
	canvasSubmitButtonText,
	canvasTheme,
	canvasView,
	successSettings,
	canRemovePage,
	description,
	hasCanvasSections,
	isCustomizing,
	pages,
	pageTransition,
	pageTransitionDirection,
	pageTransitionVariants,
	paletteFieldPlaceholderId,
	paletteSectionPlaceholderId,
	title,
	onAddPage,
	onAddSection,
	onCanvasViewChange,
	onEditField,
	onEditSection,
	onEditSuccessBlock,
	onMoveSuccessBlock,
	onReorderSuccessBlocks,
	onFieldSurfaceRef,
	onCanvasRef,
	onRemoveField,
	onRemovePage,
	onRemoveSection,
	onSelectPage,
}: BuilderCanvasPanelProps) {
	const showSuccessView = canvasView === "success";
	// Live-reorder state on dragover like the form canvas does, so the
	// stored order always matches what respondents will see.
	const blockOrderSnapshot = useRef<SuccessBlockId[] | null>(null);
	const handleBlockDragStart = () => {
		blockOrderSnapshot.current = successSettings.blockOrder;
	};
	const handleBlockDragOver = (event: DragOverEvent) => {
		const { source, target } = event.operation;
		if (!source || !target) return;
		const blockOrder = move(successSettings.blockOrder, event);
		if (
			blockOrder.some(
				(block, index) => block !== successSettings.blockOrder[index],
			)
		) {
			onReorderSuccessBlocks(blockOrder as SuccessBlockId[]);
		}
	};
	const handleBlockDragEnd = (event: DragEndEvent) => {
		const snapshot = blockOrderSnapshot.current;
		blockOrderSnapshot.current = null;
		if ((event.canceled || !event.operation.target) && snapshot) {
			onReorderSuccessBlocks(snapshot);
		}
	};
	// Every block renders its frame, so the sortable indices always
	// match the stored block order — including while buttons are hidden.
	return (
		<Card
			className={cn(
				"mb-0 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-none border-none bg-card text-card-foreground shadow-none !p-0",
			)}
		>
			<ChromeTabStrip
				pages={pages}
				activePageId={activePageId}
				activeTabBackground={activeTabBackground}
				successActive={showSuccessView}
				onSelectPage={onSelectPage}
				onRemovePage={onRemovePage}
				onAddPage={onAddPage}
				onSelectSuccess={() => onCanvasViewChange("success")}
				canRemovePage={canRemovePage}
			/>
			<CardContent
				data-testid="builder-canvas"
				data-form-theme={canvasTheme ? true : undefined}
				style={getFormThemeStyle(canvasTheme)}
				className={cn(
					"min-h-0 flex-1 overflow-y-auto [overflow-anchor:none] p-3 md:p-4",
					!hasCanvasSections &&
						!showSuccessView &&
						"flex h-full w-full items-center justify-center",
				)}
			>
				{showSuccessView ? (
					<DragDropProvider
						sensors={successBlockSensors}
						onDragStart={handleBlockDragStart}
						onDragOver={handleBlockDragOver}
						onDragEnd={handleBlockDragEnd}
					>
						<FormSubmittedPage
							preview
							formPath="#"
							redirectUrl={successSettings.redirectUrl}
							titleText={successSettings.title}
							messageText={successSettings.message}
							blockOrder={successSettings.blockOrder}
							submitAnotherResponseText={
								successSettings.submitAnotherResponseText
							}
							returnToHomepageText={successSettings.returnToHomepageText}
							showSubmitAnotherResponse={
								successSettings.showSubmitAnotherResponse
							}
							showReturnToHomepage={successSettings.showReturnToHomepage}
							extraButtons={successSettings.extraButtons}
							renderBlock={(block, content) => (
								<SortableSuccessBlock
									block={block}
									index={successSettings.blockOrder.indexOf(block)}
									label={SUCCESS_BLOCK_LABELS[block].toLowerCase()}
									canMoveUp={successSettings.blockOrder[0] !== block}
									canMoveDown={
										successSettings.blockOrder[
											successSettings.blockOrder.length - 1
										] !== block
									}
									onEdit={() => onEditSuccessBlock(block)}
									onMoveUp={() => onMoveSuccessBlock(block, -1)}
									onMoveDown={() => onMoveSuccessBlock(block, 1)}
								>
									{content}
								</SortableSuccessBlock>
							)}
						/>
						<DragOverlay>
							{(source) => {
								if (!source || !isSortable(source)) return null;

								const block = (
									Object.keys(SUCCESS_BLOCK_LABELS) as SuccessBlockId[]
								).find((id) => id === source.id);
								if (!block) return null;

								const width =
									source.sortable.element?.getBoundingClientRect().width;
								return (
									<div
										inert
										style={width ? { width } : undefined}
										className="pointer-events-none cursor-grabbing shadow-2xl"
									>
										{/*
										 * Freeze entrance animation: motion writes
										 * individual transform properties, so every
										 * one must be pinned for the clone to render
										 * fully formed for the whole drag. text-center
										 * mirrors the block container the portal escapes.
										 */}
										<div className="rounded-lg border-2 border-dashed border-primary/50 bg-card p-3 text-center [&_*]:translate-none! [&_*]:scale-none! [&_*]:rotate-none! [&_*]:transform-none! [&_*]:filter-none! [&_*]:opacity-100!">
											<SuccessBlockOverlayContent
												block={block}
												settings={successSettings}
											/>
										</div>
									</div>
								);
							}}
						</DragOverlay>
					</DragDropProvider>
				) : (
					<AnimatePresence mode="popLayout" custom={pageTransitionDirection}>
						<motion.div
							key={activePageId}
							custom={pageTransitionDirection}
							className={cn("w-full", !hasCanvasSections && "h-full")}
							variants={pageTransitionVariants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={pageTransition}
						>
							<BuilderCanvas
								title={title}
								description={description}
								layout={canvasLayout}
								submitButtonText={canvasSubmitButtonText}
								isCustomizing={isCustomizing}
								activePage={activePage}
								hasSections={hasCanvasSections}
								onAddSection={onAddSection}
								onCanvasRef={onCanvasRef}
								onEditSection={onEditSection}
								onEditField={onEditField}
								onFieldSurfaceRef={onFieldSurfaceRef}
								onRemoveSection={onRemoveSection}
								onRemoveField={onRemoveField}
								paletteFieldPlaceholderId={paletteFieldPlaceholderId}
								paletteSectionPlaceholderId={paletteSectionPlaceholderId}
							/>
						</motion.div>
					</AnimatePresence>
				)}
			</CardContent>
		</Card>
	);
}
