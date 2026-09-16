import type { FieldConfig } from '@/features/form-builder/elements'
import type { FormPage } from '@/features/form-builder/form-structure'
import { cn } from '@/lib/utils'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import type { PropsWithChildren } from 'react'
import { memo, useCallback } from 'react'

import {
  CANVAS_DROP_ID,
  ITEM_TYPE,
  PALETTE_FIELD_TYPE,
  PALETTE_SECTION_TYPE,
  SECTION_GROUP_ID,
  SECTION_TYPE,
} from '../drag-model'
import { ItemCard, SectionCard } from './builder-cards'

interface SortableItemProps {
  field: FieldConfig
  index: number
  isPlaceholder?: boolean
  onEdit: () => void
  onRemove: () => void
  sectionId: string
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
  })

  return (
    <ItemCard
      ref={ref}
      field={field}
      onEdit={onEdit}
      onRemove={onRemove}
      state={isDragSource || isPlaceholder ? 'ghost' : undefined}
    />
  )
})

interface SortableSectionProps {
  fields: FieldConfig[]
  id: string
  index: number
  isPlaceholder?: boolean
  label: string
  onEditField: (field: FieldConfig) => void
  onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void
  onRemoveField: (fieldId: string) => void
  placeholderFieldId?: string | null
}

const SortableSection = memo(function SortableSection({
  fields,
  id,
  index,
  isPlaceholder,
  label,
  onEditField,
  onFieldSurfaceRef,
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
  })
  const { ref: fieldSurfaceDropRef } = useDroppable({
    id: `builder-section-${id}-field-surface`,
    accept: [ITEM_TYPE, PALETTE_FIELD_TYPE],
    collisionPriority: CollisionPriority.Low,
    disabled: fields.length > 0,
    type: 'field-surface',
    data: { sectionId: id },
  })
  const setFieldSurfaceRef = useCallback(
    (element: HTMLDivElement | null) => {
      fieldSurfaceDropRef(element)
      onFieldSurfaceRef(id, element)
    },
    [fieldSurfaceDropRef, id, onFieldSurfaceRef],
  )

  return (
    <SectionCard
      ref={ref}
      label={label}
      isEmpty={fields.length === 0}
      hasDragHandle
      handleRef={handleRef}
      fieldSurfaceRef={setFieldSurfaceRef}
      state={isDragSource || isPlaceholder ? 'ghost' : undefined}
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
  )
})

function CanvasDropSurface({
  children,
  hasSections,
  onCanvasRef,
}: {
  children: React.ReactNode
  hasSections: boolean
  onCanvasRef: (element: HTMLDivElement | null) => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: CANVAS_DROP_ID,
    accept: [PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE],
    collisionPriority: CollisionPriority.Low,
    type: 'canvas',
  })
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      ref(element)
      onCanvasRef(element)
    },
    [onCanvasRef, ref],
  )

  return (
    <div
      ref={setRef}
      className={cn('w-full', !hasSections && 'h-full')}
    >
      {hasSections ? (
        children
      ) : (
        <div
          className={cn(
            'flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed text-center text-muted-foreground transition-colors',
            isDropTarget && 'border-primary bg-primary/10 text-primary',
          )}
        >
          <p>
            {isDropTarget
              ? 'Drop field or section here'
              : 'Drag elements here to build your form or Generate with AI'}
          </p>
        </div>
      )}
    </div>
  )
}

interface BuilderCanvasProps {
  activePage: FormPage
  hasSections: boolean
  onCanvasRef: (element: HTMLDivElement | null) => void
  onEditField: (field: FieldConfig, sectionId: string) => void
  onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void
  onRemoveField: (sectionId: string, fieldId: string) => void
  paletteFieldPlaceholderId: string | null
  paletteSectionPlaceholderId: string | null
}

export function BuilderCanvas({
  activePage,
  hasSections,
  onCanvasRef,
  onEditField,
  onFieldSurfaceRef,
  onRemoveField,
  paletteFieldPlaceholderId,
  paletteSectionPlaceholderId,
}: BuilderCanvasProps) {
  return (
    <CanvasDropSurface
      hasSections={hasSections}
      onCanvasRef={onCanvasRef}
    >
      <div className="mx-auto min-h-full font-sans text-card-foreground">
        <div className="space-y-4 pb-8">
          {activePage.sections.map((section, sectionIndex) => (
            <SortableSection
              key={section.id}
              id={section.id}
              index={sectionIndex}
              label={`Section ${sectionIndex + 1}`}
              fields={section.fields}
              isPlaceholder={section.id === paletteSectionPlaceholderId}
              placeholderFieldId={paletteFieldPlaceholderId}
              onFieldSurfaceRef={onFieldSurfaceRef}
              onEditField={(field) => onEditField(field, section.id)}
              onRemoveField={(fieldId) => onRemoveField(section.id, fieldId)}
            />
          ))}
        </div>
      </div>
    </CanvasDropSurface>
  )
}
