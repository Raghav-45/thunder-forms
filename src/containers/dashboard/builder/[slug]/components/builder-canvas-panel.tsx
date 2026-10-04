import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "motion/react";
import { Card, CardContent } from "#/components/ui/card";
import { BuilderCanvas } from "#/containers/dashboard/builder/[slug]/components/builder-canvas";
import { ChromeTabStrip } from "#/containers/dashboard/builder/[slug]/components/chrome-tab-strip";
import type { FormStructure } from "#/containers/dashboard/builder/[slug]/drag-model";
import type { FieldConfig } from "#/features/form-builder/elements";
import type {
	FormLayout,
	FormPage,
} from "#/features/form-builder/form-structure";
import { getFormThemeStyle } from "#/features/form-builder/theme";
import { cn } from "#/lib/utils";

interface BuilderCanvasPanelProps {
	activePage: FormPage;
	activePageId: string;
	activeTabBackground: string | undefined;
	canvasLayout: FormLayout | undefined;
	canvasSubmitButtonText: string | undefined;
	canvasTheme: FormStructure["theme"];
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
	onEditField: (field: FieldConfig, sectionId: string) => void;
	onEditSection: (section: FormPage["sections"][number]) => void;
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
	onEditField,
	onEditSection,
	onFieldSurfaceRef,
	onCanvasRef,
	onRemoveField,
	onRemovePage,
	onRemoveSection,
	onSelectPage,
}: BuilderCanvasPanelProps) {
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
				onSelectPage={onSelectPage}
				onRemovePage={onRemovePage}
				onAddPage={onAddPage}
				canRemovePage={canRemovePage}
			/>
			<CardContent
				data-testid="builder-canvas"
				data-form-theme={canvasTheme ? true : undefined}
				style={getFormThemeStyle(canvasTheme)}
				className={cn(
					"min-h-0 flex-1 overflow-y-auto [overflow-anchor:none] p-3 md:p-4",
					!hasCanvasSections &&
						"flex h-full w-full items-center justify-center",
				)}
			>
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
			</CardContent>
		</Card>
	);
}
