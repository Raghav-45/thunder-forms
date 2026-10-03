import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import {
	CANVAS_DROP_ID,
	createPage,
	createQuizAwareField,
	createSection,
	type DropTarget,
	type FormSection,
	type FormStructure,
	getPage,
	removeField,
	removePage,
	removeSection,
	stagePaletteField,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import type { FieldConfig } from "#/features/form-builder/elements";
import type { AvailableFieldsType } from "#/features/form-builder/types";

export interface EditingField {
	field: FieldConfig;
	pageId: string;
	sectionId: string;
}

export interface EditingSection {
	pageId: string;
	section: FormSection;
}

interface UseStructureActionsParams {
	formStructure: FormStructure;
	resolvedActivePageId: string;
	setActivePageId: (pageId: string) => void;
	setEditingField: Dispatch<SetStateAction<EditingField | null>>;
	setEditingSection: Dispatch<SetStateAction<EditingSection | null>>;
	setFormStructure: Dispatch<SetStateAction<FormStructure>>;
	transitionRef: { current: number };
}

export function useStructureActions({
	formStructure,
	resolvedActivePageId,
	setActivePageId,
	setEditingField,
	setEditingSection,
	setFormStructure,
	transitionRef,
}: UseStructureActionsParams) {
	const addPage = useCallback(() => {
		const page = createPage();
		transitionRef.current = 1;
		setFormStructure((prev) => ({
			...prev,
			pages: [...prev.pages, page],
		}));
		setActivePageId(page.id);
	}, [setActivePageId, setFormStructure, transitionRef]);

	const removePageById = useCallback(
		(pageId: string) => {
			const pageIndex = formStructure.pages.findIndex(
				(page) => page.id === pageId,
			);
			const nextStructure = removePage(formStructure, pageId);
			if (nextStructure === formStructure) return;

			if (pageId === resolvedActivePageId) {
				if (pageIndex > 0) {
					transitionRef.current = -1;
				}
				setActivePageId(nextStructure.pages[Math.max(0, pageIndex - 1)].id);
			}

			setEditingField((current) =>
				current?.pageId === pageId ? null : current,
			);
			setEditingSection((current) =>
				current?.pageId === pageId ? null : current,
			);
			setFormStructure(nextStructure);
		},
		[
			formStructure,
			resolvedActivePageId,
			setActivePageId,
			setEditingField,
			setEditingSection,
			setFormStructure,
			transitionRef,
		],
	);

	const addSection = useCallback(() => {
		const section = createSection();
		setFormStructure((prev) => ({
			...prev,
			pages: prev.pages.map((page) =>
				page.id === resolvedActivePageId
					? { ...page, sections: [...page.sections, section] }
					: page,
			),
		}));
	}, [resolvedActivePageId, setFormStructure]);

	const addField = useCallback(
		(fieldType: AvailableFieldsType) => {
			setFormStructure((prev) => {
				const page = getPage(prev, resolvedActivePageId);
				if (!page) return prev;

				const field = createQuizAwareField(fieldType, prev.quiz);
				const target: DropTarget = { id: CANVAS_DROP_ID };
				return stagePaletteField(prev, resolvedActivePageId, field, target)
					.structure;
			});
		},
		[resolvedActivePageId, setFormStructure],
	);

	const removeFieldById = useCallback(
		(sectionId: string, fieldId: string) => {
			setFormStructure((prev) =>
				removeField(prev, resolvedActivePageId, sectionId, fieldId),
			);
			setEditingField((current) =>
				current?.sectionId === sectionId && current.field.id === fieldId
					? null
					: current,
			);
		},
		[resolvedActivePageId, setEditingField, setFormStructure],
	);

	const removeSectionById = useCallback(
		(sectionId: string) => {
			setFormStructure((prev) =>
				removeSection(prev, resolvedActivePageId, sectionId),
			);
			setEditingSection((current) =>
				current?.section.id === sectionId ? null : current,
			);
		},
		[resolvedActivePageId, setEditingSection, setFormStructure],
	);

	return {
		addField,
		addPage,
		addSection,
		removeFieldById,
		removePageById,
		removeSectionById,
	};
}
