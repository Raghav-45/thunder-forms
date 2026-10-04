import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";
import { memo, useCallback } from "react";
import { Button } from "#/components/ui/button";
import {
	ItemCard,
	SectionCard,
} from "#/containers/dashboard/builder/[slug]/components/builder-cards";
import {
	CANVAS_DROP_ID,
	ITEM_TYPE,
	PALETTE_FIELD_TYPE,
	PALETTE_SECTION_TYPE,
	SECTION_GROUP_ID,
	SECTION_TYPE,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import { FORM_SUBMIT_WIDTH_CLASSES } from "#/features/form-builder/constants";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	type FormLayout,
	type FormPage,
	type NormalizedFormLayout,
	normalizeFormLayout,
} from "#/features/form-builder/form-structure";
import { cn } from "#/lib/utils";

interface SortableItemProps {
	field: FieldConfig;
	index: number;
	isPlaceholder?: boolean;
	onEdit: () => void;
	onRemove: () => void;
	sectionId: string;
}

const SortableItem = memo(function SortableItem({
	field,
	index,
	isPlaceholder,
	onEdit,
	onRemove,
	sectionId,
}: PropsWithChildren<SortableItemProps>) {
	const { isDragSource, ref } = useSortable({
		id: field.id,
		group: sectionId,
		accept: [ITEM_TYPE, PALETTE_FIELD_TYPE],
		type: ITEM_TYPE,
		index,
		data: { sectionId },
	});

	return (
		<ItemCard
			ref={ref}
			field={field}
			onEdit={onEdit}
			onRemove={onRemove}
			state={isDragSource || isPlaceholder ? "ghost" : undefined}
		/>
	);
});

interface SortableSectionProps {
	layout?: NormalizedFormLayout;
	description?: string;
	fields: FieldConfig[];
	id: string;
	index: number;
	isPlaceholder?: boolean;
	label: string;
	onEdit: () => void;
	onEditField: (field: FieldConfig) => void;
	onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void;
	onRemove: () => void;
	onRemoveField: (fieldId: string) => void;
	placeholderFieldId?: string | null;
}

const SortableSection = memo(function SortableSection({
	layout,
	description,
	fields,
	id,
	index,
	isPlaceholder,
	label,
	onEdit,
	onEditField,
	onFieldSurfaceRef,
	onRemove,
	onRemoveField,
	placeholderFieldId,
}: PropsWithChildren<SortableSectionProps>) {
	const { handleRef, isDragSource, ref } = useSortable({
		id,
		group: SECTION_GROUP_ID,
		accept: [SECTION_TYPE, ITEM_TYPE, PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE],
		collisionPriority: CollisionPriority.Low,
		type: SECTION_TYPE,
		index,
		data: { sectionId: id },
	});
	const { ref: fieldSurfaceDropRef } = useDroppable({
		id: `builder-section-${id}-field-surface`,
		accept: [ITEM_TYPE, PALETTE_FIELD_TYPE],
		collisionPriority: CollisionPriority.Low,
		disabled: fields.length > 0,
		type: "field-surface",
		data: { sectionId: id },
	});
	const setFieldSurfaceRef = useCallback(
		(element: HTMLDivElement | null) => {
			fieldSurfaceDropRef(element);
			onFieldSurfaceRef(id, element);
		},
		[fieldSurfaceDropRef, id, onFieldSurfaceRef],
	);

	return (
		<SectionCard
			layout={layout}
			ref={ref}
			label={label}
			description={description}
			isEmpty={fields.length === 0}
			hasDragHandle
			handleRef={handleRef}
			fieldSurfaceRef={setFieldSurfaceRef}
			onEdit={isPlaceholder ? undefined : onEdit}
			onRemove={isPlaceholder ? undefined : onRemove}
			state={isDragSource || isPlaceholder ? "ghost" : undefined}
		>
			{fields.map((field, fieldIndex) => (
				<SortableItem
					key={field.id}
					field={field}
					index={fieldIndex}
					isPlaceholder={field.id === placeholderFieldId}
					onEdit={() => onEditField(field)}
					onRemove={() => onRemoveField(field.id)}
					sectionId={id}
				/>
			))}
		</SectionCard>
	);
});

function CanvasDropSurface({
	children,
	hasSections,
	onAddSection,
	onCanvasRef,
}: {
	children: React.ReactNode;
	hasSections: boolean;
	onAddSection: () => void;
	onCanvasRef: (element: HTMLDivElement | null) => void;
}) {
	const { isDropTarget, ref } = useDroppable({
		id: CANVAS_DROP_ID,
		accept: [PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE],
		collisionPriority: CollisionPriority.Low,
		type: "canvas",
	});
	const setRef = useCallback(
		(element: HTMLDivElement | null) => {
			ref(element);
			onCanvasRef(element);
		},
		[onCanvasRef, ref],
	);

	return (
		<div ref={setRef} className={cn("w-full", !hasSections && "h-full")}>
			{hasSections ? (
				children
			) : (
				<div
					className={cn(
						"flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed text-center text-muted-foreground transition-colors",
						isDropTarget && "border-primary bg-primary/10 text-primary",
					)}
				>
					{isDropTarget ? (
						<p>Drop field or section here</p>
					) : (
						<div className="flex max-w-md flex-col items-center gap-3 px-6 py-12">
							<h2 className="text-2xl font-semibold tracking-tight text-foreground">
								Start building your form
							</h2>
							<p className="text-sm">
								Add a section to organize your questions, or choose a field from
								the panel on the right.
							</p>
							<Button
								type="button"
								onClick={onAddSection}
								className="mt-1 rounded-full"
							>
								<PlusIcon data-icon="inline-start" />
								Add a section
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface BuilderCanvasProps {
	title: string;
	description?: string;
	layout?: FormLayout;
	submitButtonText?: string;
	isCustomizing?: boolean;
	activePage: FormPage;
	hasSections: boolean;
	onAddSection: () => void;
	onCanvasRef: (element: HTMLDivElement | null) => void;
	onEditSection: (section: FormPage["sections"][number]) => void;
	onEditField: (field: FieldConfig, sectionId: string) => void;
	onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void;
	onRemoveSection: (sectionId: string) => void;
	onRemoveField: (sectionId: string, fieldId: string) => void;
	paletteFieldPlaceholderId: string | null;
	paletteSectionPlaceholderId: string | null;
}

export function BuilderCanvas({
	title,
	description,
	layout,
	submitButtonText,
	isCustomizing = false,
	activePage,
	hasSections,
	onAddSection,
	onCanvasRef,
	onEditSection,
	onEditField,
	onFieldSurfaceRef,
	onRemoveSection,
	onRemoveField,
	paletteFieldPlaceholderId,
	paletteSectionPlaceholderId,
}: BuilderCanvasProps) {
	const normalizedLayout = normalizeFormLayout(layout);
	const layoutGap = (units: number) => `calc(var(--spacing) * ${units})`;
	const shouldReduceMotion = useReducedMotion();
	const revealTransition = shouldReduceMotion
		? { duration: 0.15 }
		: {
				type: "spring" as const,
				stiffness: 400,
				damping: 35,
				mass: 0.8,
			};
	// The heading rises out from behind the sections; the submit button drops
	// out the opposite way. Same spring as the page switch, mirrored vertically.
	const headingReveal = shouldReduceMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
			}
		: {
				initial: {
					opacity: 0,
					height: 0,
					y: 32,
					scale: 0.98,
					filter: "blur(8px)",
				},
				animate: {
					opacity: 1,
					height: "auto",
					y: 0,
					scale: 1,
					filter: "blur(0px)",
				},
				exit: {
					opacity: 0,
					height: 0,
					y: 32,
					scale: 0.98,
					filter: "blur(8px)",
				},
			};
	const submitReveal = shouldReduceMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
			}
		: {
				initial: {
					opacity: 0,
					height: 0,
					y: -32,
					scale: 0.98,
					filter: "blur(8px)",
				},
				animate: {
					opacity: 1,
					height: "auto",
					y: 0,
					scale: 1,
					filter: "blur(0px)",
				},
				exit: {
					opacity: 0,
					height: 0,
					y: -32,
					scale: 0.98,
					filter: "blur(8px)",
				},
			};
	return (
		<CanvasDropSurface
			hasSections={hasSections}
			onAddSection={onAddSection}
			onCanvasRef={onCanvasRef}
		>
			<div
				className={cn(
					"min-h-full font-sans text-card-foreground",
					normalizedLayout.contentAlignment === "left" ? "mr-auto" : "mx-auto",
					layout &&
						{ compact: "max-w-3xl", standard: "max-w-6xl", wide: "max-w-7xl" }[
							normalizedLayout.contentWidth
						],
				)}
			>
				<AnimatePresence initial={false}>
					{isCustomizing ? (
						<motion.div
							key="form-heading"
							className="overflow-hidden"
							initial={headingReveal.initial}
							animate={headingReveal.animate}
							exit={headingReveal.exit}
							transition={revealTransition}
						>
							<div
								className={cn(
									"flex flex-col",
									normalizedLayout.headerAlignment === "center"
										? "items-center text-center"
										: "items-start text-left",
								)}
								style={{
									gap: layoutGap(normalizedLayout.spacing.titleDescriptionGap),
									marginBottom: layoutGap(
										normalizedLayout.spacing.titleContentGap,
									),
								}}
							>
								<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
								{description ? (
									<p className="text-muted-foreground">{description}</p>
								) : null}
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>
				<div
					className={cn(layout ? "flex flex-col" : "space-y-4")}
					style={
						layout
							? { gap: layoutGap(normalizedLayout.spacing.sectionGap) }
							: undefined
					}
				>
					{activePage.sections.map((section, sectionIndex) => (
						<SortableSection
							layout={layout ? normalizedLayout : undefined}
							key={section.id}
							id={section.id}
							index={sectionIndex}
							label={section.title || `Section ${sectionIndex + 1}`}
							description={section.description}
							fields={section.fields}
							isPlaceholder={section.id === paletteSectionPlaceholderId}
							placeholderFieldId={paletteFieldPlaceholderId}
							onFieldSurfaceRef={onFieldSurfaceRef}
							onEdit={() => onEditSection(section)}
							onEditField={(field) => onEditField(field, section.id)}
							onRemove={() => onRemoveSection(section.id)}
							onRemoveField={(fieldId) => onRemoveField(section.id, fieldId)}
						/>
					))}
				</div>
				<AnimatePresence initial={false}>
					{isCustomizing ? (
						<motion.div
							key="form-submit"
							className="overflow-hidden"
							initial={submitReveal.initial}
							animate={submitReveal.animate}
							exit={submitReveal.exit}
							transition={revealTransition}
						>
							<div
								className={cn(
									"flex pb-8",
									{
										left: "justify-start",
										center: "justify-center",
										right: "justify-end",
									}[normalizedLayout.submitAlignment],
								)}
								style={{
									marginTop: layoutGap(normalizedLayout.spacing.submitGap),
								}}
							>
								<Button
									type="button"
									className={cn(
										"pointer-events-none h-auto min-h-9 max-w-full whitespace-normal break-words",
										FORM_SUBMIT_WIDTH_CLASSES[normalizedLayout.submitWidth],
									)}
									tabIndex={-1}
								>
									{submitButtonText || "Submit"}
								</Button>
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>
			</div>
		</CanvasDropSurface>
	);
}
