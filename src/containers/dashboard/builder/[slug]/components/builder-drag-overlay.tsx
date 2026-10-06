import { DragOverlay } from "@dnd-kit/react";
import type { RefObject } from "react";
import {
	ItemCard,
	SectionCard,
} from "#/containers/dashboard/builder/[slug]/components/builder-cards";
import {
	findField,
	ITEM_TYPE,
	PALETTE_FIELD_TYPE,
	PALETTE_SECTION_TYPE,
	SECTION_TYPE,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	type FormLayout,
	type FormPage,
	type FormSection,
	type FormStructure,
	normalizeFormLayout,
} from "#/features/form-builder/form-structure";
import { getFormThemeStyle } from "#/features/form-builder/theme";

interface BuilderDragOverlayProps {
	activePage: FormPage;
	canvasWidth: number | null;
	fieldOverlayWidth: number | null;
	layout: FormLayout | undefined;
	paletteFieldRef: RefObject<FieldConfig | null>;
	paletteSectionRef: RefObject<FormSection | null>;
	theme: FormStructure["theme"];
}

interface OverlaySource {
	id: string | number;
	type: unknown;
}

export function BuilderDragOverlay({
	activePage,
	canvasWidth,
	fieldOverlayWidth,
	layout,
	paletteFieldRef,
	paletteSectionRef,
	theme,
}: BuilderDragOverlayProps) {
	// Mirror the canvas (`BuilderCanvas` passes `layout` through only when
	// set): normalize only when a layout exists, otherwise keep the same
	// card fallbacks the canvas section uses.
	const normalizedLayout = layout ? normalizeFormLayout(layout) : undefined;
	function getOverlayContent(source: OverlaySource | null) {
		if (!source) return null;

		if (source.type === SECTION_TYPE) {
			if (!canvasWidth) return null;

			const sectionIndex = activePage.sections.findIndex(
				(section) => section.id === source.id,
			);
			const section = activePage.sections[sectionIndex];
			if (!section) return null;

			return (
				<SectionCard
					label={section.title || `Section ${sectionIndex + 1}`}
					description={section.description}
					isEmpty={section.fields.length === 0}
					state="floating"
					floatingWidth={canvasWidth}
					layout={normalizedLayout}
					// The canvas keeps its edit/remove buttons in the layout
					// (opacity-0 until hover); reserve the same space here so
					// the clone keeps the source's height.
					reserveActions
				>
					{section.fields.map((field) => (
						<ItemCard key={field.id} field={field} />
					))}
				</SectionCard>
			);
		}

		if (source.type === ITEM_TYPE) {
			const field = findField(activePage, String(source.id))?.field;
			if (!field || !fieldOverlayWidth) return null;

			return (
				<ItemCard
					field={field}
					state="floating"
					floatingWidth={fieldOverlayWidth}
				/>
			);
		}

		if (source.type === PALETTE_FIELD_TYPE) {
			const field = paletteFieldRef.current;
			if (!field || !fieldOverlayWidth) return null;

			return (
				<ItemCard
					field={field}
					state="floating"
					floatingWidth={fieldOverlayWidth}
				/>
			);
		}

		if (source.type === PALETTE_SECTION_TYPE) {
			if (!paletteSectionRef.current || !canvasWidth) return null;

			return (
				<SectionCard
					label="New section"
					isEmpty
					state="floating"
					floatingWidth={canvasWidth}
					layout={normalizedLayout}
				/>
			);
		}

		return null;
	}

	return (
		<DragOverlay>
			{(source) => {
				// The overlay portals to document.body, escaping the themed canvas
				// scope — re-apply the live theme here so the floating clone
				// matches the customized canvas instead of :root defaults.
				// display:contents keeps the wrapper out of drag measurement.
				const overlay = getOverlayContent(source);
				if (!overlay) return null;
				return (
					<div
						data-form-theme={theme ? true : undefined}
						style={getFormThemeStyle(theme)}
						className="contents"
					>
						{overlay}
					</div>
				);
			}}
		</DragOverlay>
	);
}
