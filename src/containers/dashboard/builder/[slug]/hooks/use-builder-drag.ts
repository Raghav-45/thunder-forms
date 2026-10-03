import { move } from "@dnd-kit/helpers";
import type { DragDropEventHandlers } from "@dnd-kit/react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	createQuizAwareField,
	createSection,
	type DropTarget,
	type FormPage,
	type FormSection,
	type FormStructure,
	findField,
	getPage,
	ITEM_TYPE,
	moveExistingField,
	PALETTE_FIELD_TYPE,
	PALETTE_SECTION_TYPE,
	removeField,
	removeSection,
	SECTION_TYPE,
	stagePaletteField,
	stagePaletteSection,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import type { FieldConfig } from "#/features/form-builder/elements";
import type { AvailableFieldsType } from "#/features/form-builder/types";

interface UseBuilderDragParams {
	activePage: FormPage;
	formStructure: FormStructure;
	resolvedActivePageId: string;
	setFormStructure: Dispatch<SetStateAction<FormStructure>>;
}

export function useBuilderDrag({
	activePage,
	formStructure,
	resolvedActivePageId,
	setFormStructure,
}: UseBuilderDragParams) {
	const [paletteFieldPlaceholderId, setPaletteFieldPlaceholderId] = useState<
		string | null
	>(null);
	const [paletteSectionPlaceholderId, setPaletteSectionPlaceholderId] =
		useState<string | null>(null);
	const [fieldOverlayWidth, setFieldOverlayWidth] = useState<number | null>(
		null,
	);

	const fieldSurfaceRefs = useRef(new Map<string, HTMLDivElement>());
	const formStructureSnapshot = useRef<FormStructure | null>(null);
	const paletteFieldClone = useRef<FieldConfig | null>(null);
	const paletteSectionClone = useRef<FormSection | null>(null);
	const palettePlacement = useRef(false);

	const registerFieldSurface = useCallback(
		(sectionId: string, element: HTMLDivElement | null) => {
			if (element) {
				fieldSurfaceRefs.current.set(sectionId, element);
			} else {
				fieldSurfaceRefs.current.delete(sectionId);
			}
		},
		[],
	);

	const setFieldOverlayWidthFromSurface = useCallback(
		(surface: HTMLDivElement | undefined) => {
			if (!surface) return;

			const width = surface.getBoundingClientRect().width;
			setFieldOverlayWidth((currentWidth) =>
				currentWidth !== null && Math.abs(currentWidth - width) < 0.5
					? currentWidth
					: width,
			);
		},
		[],
	);

	const measureFieldSurface = useCallback(
		(target: DropTarget | null | undefined) => {
			const targetData = target?.data as { sectionId?: unknown } | undefined;
			const targetId = String(target?.id ?? "");
			const sectionId =
				(typeof targetData?.sectionId === "string"
					? targetData.sectionId
					: undefined) ??
				activePage.sections.find((section) => section.id === targetId)?.id ??
				findField(activePage, targetId)?.section.id;

			setFieldOverlayWidthFromSurface(
				sectionId ? fieldSurfaceRefs.current.get(sectionId) : undefined,
			);
		},
		[activePage, setFieldOverlayWidthFromSurface],
	);

	useLayoutEffect(() => {
		const clone = paletteFieldClone.current;
		if (!clone) return;

		const location = findField(activePage, clone.id);
		setFieldOverlayWidthFromSurface(
			location ? fieldSurfaceRefs.current.get(location.section.id) : undefined,
		);
	}, [activePage, setFieldOverlayWidthFromSurface]);

	const resetPaletteDrag = useCallback(() => {
		paletteFieldClone.current = null;
		paletteSectionClone.current = null;
		palettePlacement.current = false;
		setPaletteFieldPlaceholderId(null);
		setPaletteSectionPlaceholderId(null);
		setFieldOverlayWidth(null);
	}, []);

	const handleDragStart = useCallback<DragDropEventHandlers["onDragStart"]>(
		(event) => {
			const { source } = event.operation;
			if (!source) return;

			formStructureSnapshot.current = structuredClone(formStructure);
			palettePlacement.current = false;

			if (source.type === PALETTE_FIELD_TYPE) {
				const sourceData = source.data as { fieldType?: unknown } | undefined;
				const fieldType = sourceData?.fieldType;
				if (typeof fieldType !== "string") return;

				const field = createQuizAwareField(
					fieldType as AvailableFieldsType,
					formStructure.quiz,
				);
				field.id = `palette_${crypto.randomUUID().slice(0, 8)}`;
				paletteFieldClone.current = field;
				setPaletteFieldPlaceholderId(field.id);
				setFieldOverlayWidth(null);
				return;
			}

			if (source.type === PALETTE_SECTION_TYPE) {
				const section = createSection();
				paletteSectionClone.current = section;
				setPaletteSectionPlaceholderId(section.id);
				return;
			}

			if (source.type === ITEM_TYPE) {
				measureFieldSurface(source as unknown as DropTarget);
			}
		},
		[formStructure, measureFieldSurface],
	);

	const handleDragOver = useCallback<DragDropEventHandlers["onDragOver"]>(
		(event) => {
			const { source, target } = event.operation;
			if (!source) return;

			const targetCenterY = target?.shape?.center.y;
			const targetWithPlacement: DropTarget | null = target
				? {
						id: target.id,
						index: (target as unknown as DropTarget).index,
						data: target.data,
						insertAfter:
							targetCenterY !== undefined &&
							event.operation.position.current.y > targetCenterY,
					}
				: null;

			if (source.type === PALETTE_FIELD_TYPE) {
				event.preventDefault();
				const field = paletteFieldClone.current;
				if (!field) return;

				if (!target || !targetWithPlacement) {
					palettePlacement.current = false;
					setFormStructure((prev) =>
						removeField(
							prev,
							resolvedActivePageId,
							findField(getPage(prev, resolvedActivePageId), field.id)?.section
								.id ?? "",
							field.id,
						),
					);
					return;
				}

				measureFieldSurface(targetWithPlacement);
				// React may defer the state updater until after dragend. Record the
				// accepted target before scheduling it so a valid palette drop cannot
				// be mistaken for an outside drop.
				palettePlacement.current = true;
				setFormStructure((prev) => {
					const result = stagePaletteField(
						prev,
						resolvedActivePageId,
						field,
						targetWithPlacement,
					);
					return result.structure;
				});
				return;
			}

			if (source.type === PALETTE_SECTION_TYPE) {
				event.preventDefault();
				const section = paletteSectionClone.current;
				if (!section) return;

				if (!target || !targetWithPlacement) {
					palettePlacement.current = false;
					setFormStructure((prev) =>
						removeSection(prev, resolvedActivePageId, section.id),
					);
					return;
				}

				// See the equivalent palette-field branch: this must be synchronous.
				palettePlacement.current = true;
				setFormStructure((prev) => {
					const result = stagePaletteSection(
						prev,
						resolvedActivePageId,
						section,
						targetWithPlacement,
					);
					return result.structure;
				});
				return;
			}

			if (source.type === SECTION_TYPE && target) {
				const targetId = String(target.id);
				setFormStructure((prev) => {
					const page = getPage(prev, resolvedActivePageId);
					if (
						!page ||
						!page.sections.some((section) => section.id === targetId)
					) {
						return prev;
					}

					const sections = move(page.sections, event);
					return {
						...prev,
						pages: prev.pages.map((candidate) =>
							candidate.id === resolvedActivePageId
								? { ...candidate, sections }
								: candidate,
						),
					};
				});
				return;
			}

			if (source.type === ITEM_TYPE && target && targetWithPlacement) {
				measureFieldSurface(targetWithPlacement);
				setFormStructure((prev) => {
					const page = getPage(prev, resolvedActivePageId);
					const sourceField = findField(page, String(source.id));
					const targetField = findField(page, String(target.id));

					if (
						page &&
						sourceField &&
						targetField &&
						sourceField.section.id === targetField.section.id
					) {
						const fields = move(sourceField.section.fields, event);
						return {
							...prev,
							pages: prev.pages.map((candidate) =>
								candidate.id === resolvedActivePageId
									? {
											...candidate,
											sections: candidate.sections.map((section) =>
												section.id === sourceField.section.id
													? { ...section, fields }
													: section,
											),
										}
									: candidate,
							),
						};
					}

					return moveExistingField(
						prev,
						resolvedActivePageId,
						String(source.id),
						targetWithPlacement,
					);
				});
			}
		},
		[measureFieldSurface, resolvedActivePageId, setFormStructure],
	);

	const handleDragEnd = useCallback<DragDropEventHandlers["onDragEnd"]>(
		(event) => {
			const sourceType = event.operation.source?.type;
			const isPaletteSource =
				sourceType === PALETTE_FIELD_TYPE ||
				sourceType === PALETTE_SECTION_TYPE;
			const shouldRestore =
				event.canceled ||
				(isPaletteSource ? !palettePlacement.current : !event.operation.target);

			if (shouldRestore && formStructureSnapshot.current) {
				setFormStructure(formStructureSnapshot.current);
			}

			formStructureSnapshot.current = null;
			resetPaletteDrag();
		},
		[resetPaletteDrag, setFormStructure],
	);

	return {
		fieldOverlayWidth,
		handleDragEnd,
		handleDragOver,
		handleDragStart,
		paletteFieldClone,
		paletteFieldPlaceholderId,
		paletteSectionClone,
		paletteSectionPlaceholderId,
		registerFieldSurface,
	};
}
