import type { FieldConfig } from '@/features/form-builder/elements'
import type {
  FormPage,
  FormSection,
} from '@/features/form-builder/form-structure'
import { DragOverlay } from '@dnd-kit/react'
import type { RefObject } from 'react'

import {
  ITEM_TYPE,
  PALETTE_FIELD_TYPE,
  PALETTE_SECTION_TYPE,
  SECTION_TYPE,
  findField,
} from '../drag-model'
import { ItemCard, SectionCard } from './builder-cards'

interface BuilderDragOverlayProps {
  activePage: FormPage
  canvasWidth: number | null
  fieldOverlayWidth: number | null
  paletteFieldRef: RefObject<FieldConfig | null>
  paletteSectionRef: RefObject<FormSection | null>
}

export function BuilderDragOverlay({
  activePage,
  canvasWidth,
  fieldOverlayWidth,
  paletteFieldRef,
  paletteSectionRef,
}: BuilderDragOverlayProps) {
  return (
    <DragOverlay>
      {(source) => {
        if (!source) return null

        if (source.type === SECTION_TYPE) {
          if (!canvasWidth) return null

          const sectionIndex = activePage.sections.findIndex(
            (section) => section.id === source.id,
          )
          const section = activePage.sections[sectionIndex]
          if (!section) return null

          return (
            <SectionCard
              label={section.title || `Section ${sectionIndex + 1}`}
              description={section.description}
              isEmpty={section.fields.length === 0}
              state="floating"
              floatingWidth={canvasWidth}
            >
              {section.fields.map((field) => (
                <ItemCard key={field.id} field={field} />
              ))}
            </SectionCard>
          )
        }

        if (source.type === ITEM_TYPE) {
          const field = findField(activePage, String(source.id))?.field
          if (!field || !fieldOverlayWidth) return null

          return (
            <ItemCard
              field={field}
              state="floating"
              floatingWidth={fieldOverlayWidth}
            />
          )
        }

        if (source.type === PALETTE_FIELD_TYPE) {
          const field = paletteFieldRef.current
          if (!field || !fieldOverlayWidth) return null

          return (
            <ItemCard
              field={field}
              state="floating"
              floatingWidth={fieldOverlayWidth}
            />
          )
        }

        if (source.type === PALETTE_SECTION_TYPE) {
          if (!paletteSectionRef.current || !canvasWidth) return null

          return (
            <SectionCard
              label="New section"
              isEmpty
              state="floating"
              floatingWidth={canvasWidth}
            />
          )
        }

        return null
      }}
    </DragOverlay>
  )
}
