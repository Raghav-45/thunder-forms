'use client'

import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import { FieldConfig } from '@/components/FormBuilder/elements'
import { createDefaultFieldConfig } from '@/components/FormBuilder/utils/helperFunctions'
import { CollisionPriority } from '@dnd-kit/abstract'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  DragDropEventHandlers,
  DragDropProvider,
  DragOverlay,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { GripVerticalIcon } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { memo, use, useCallback, useRef, useState } from 'react'

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

// Section ids are now real UUIDs (not the old A/B/C/D demo keys), so
// colors are assigned by position instead of looked up by id.
const ACCENT_COLORS = [
  '#7193f1',
  '#FF851B',
  '#2ECC40',
  '#ff3680',
  '#a78bfa',
  '#22d3ee',
]

interface SortableItemProps {
  id: string
  label: string
  column: string
  index: number
  accentColor: string
}

const SortableItem = memo(function SortableItem({
  id,
  label,
  column,
  index,
  accentColor,
}: PropsWithChildren<SortableItemProps>) {
  const group = column
  const { handleRef, ref, isDragging, isDragSource } = useSortable({
    id,
    group,
    accept: 'item',
    type: 'item',
    index,
    data: { group },
  })

  return (
    <div
      ref={ref as any}
      className={`border border-neutral-800 bg-neutral-950 rounded-lg p-3 transition-opacity flex items-center justify-between ${
        isDragSource ? 'opacity-30' : ''
      }`}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
    >
      <span className="font-medium text-sm text-neutral-200">
        {label} - {id}
      </span>
      <button
        ref={handleRef as any}
        className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300"
      >
        <GripVerticalIcon className="size-4" />
      </button>
    </div>
  )
})

interface SortableColumnProps {
  id: string
  index: number
  fields: FieldConfig[]
  accentColor: string
}

const SortableColumn = memo(function SortableColumn({
  fields,
  id,
  index,
  accentColor,
}: PropsWithChildren<SortableColumnProps>) {
  const { handleRef, isDragging, isDragSource, ref } = useSortable({
    id,
    accept: ['column', 'item'],
    collisionPriority: CollisionPriority.Low,
    type: 'column',
    index,
  })

  return (
    <div
      ref={ref as any}
      className={`border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 transition-opacity ${
        isDragSource ? 'opacity-30' : ''
      }`}
    >
      <div
        ref={handleRef as any}
        className="flex items-center gap-2 text-sm font-medium text-neutral-400 cursor-grab active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
        <span>Section - [{id}]</span>
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
          Drop fields here
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {fields.map((field, fieldIndex) => (
            <SortableItem
              key={field.id}
              id={field.id}
              label={field.uniqueIdentifier}
              column={id}
              index={fieldIndex}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  )
})

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface Section {
  id: string
  fields: FieldConfig[]
}

interface IFormStructure {
  pages: {
    sections: Section[]
  }[]
}

const generateNewSection = (): Section => ({
  id: crypto.randomUUID(),
  fields: [],
})

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { slug: paramFormId } = use(params)
  const [formStructure, setFormStructure] = useState<IFormStructure>({
    pages: [
      {
        sections: [generateNewSection()],
      },
    ],
  })

  const snapshot = useRef(structuredClone(formStructure))

  function handleAddSection() {
    const randomUniqueIdentifier = AVAILABLE_FIELDS[
      Math.floor(Math.random() * AVAILABLE_FIELDS.length)
    ] as avaliableFieldsType
    const newField = createDefaultFieldConfig(randomUniqueIdentifier)
    const newSection: Section = { ...generateNewSection(), fields: [newField] }

    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page, i) =>
        i === 0 ? { ...page, sections: [newSection, ...page.sections] } : page,
      ),
    }))
  }

  const sections = formStructure.pages[0].sections

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={useCallback<DragDropEventHandlers['onDragStart']>(() => {
        snapshot.current = structuredClone(formStructure)
      }, [formStructure])}
      onDragOver={useCallback<DragDropEventHandlers['onDragOver']>((event) => {
        const { source } = event.operation

        if (source && source.type === 'column') {
          return
        }

        setFormStructure((prev) => {
          const currentSections = prev.pages[0].sections

          // `move` expects a Record<groupId, items[]>, so we project the
          // sections into that shape, run the move, then project it back.
          const record = Object.fromEntries(
            currentSections.map((s) => [s.id, s.fields]),
          )
          const updated = move(record, event)

          const newSections = currentSections.map((s) => ({
            ...s,
            fields: updated[s.id] ?? s.fields,
          }))

          return {
            ...prev,
            pages: prev.pages.map((page, i) =>
              i === 0 ? { ...page, sections: newSections } : page,
            ),
          }
        })
      }, [])}
      onDragEnd={useCallback<DragDropEventHandlers['onDragEnd']>((event) => {
        if (event.canceled) {
          setFormStructure(snapshot.current)
          return
        }
      }, [])}
    >
      <div className="p-8 max-w-2xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
        <h1 className="text-3xl font-bold mb-8">Drag & Drop Testing</h1>
        <button onClick={() => handleAddSection()}>Add Field</button>
        <div className="space-y-4 pb-8">
          {sections.map((section, sectionIndex) => (
            <SortableColumn
              key={section.id}
              id={section.id}
              index={sectionIndex}
              fields={section.fields}
              accentColor={ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {(source: any) => {
          if (!source) return null

          if (source.type === 'column') {
            const sectionIndex = sections.findIndex((s) => s.id === source.id)
            const section = sections[sectionIndex]
            if (!section) return null
            const accentColor =
              ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

            return (
              <div className="border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 shadow-2xl cursor-grabbing">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                  <GripVerticalIcon className="size-4" />
                  <span>Section - [{section.id}]</span>
                </div>

                {section.fields.length === 0 ? (
                  <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
                    Drop fields here
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    {section.fields.map((field) => (
                      <div
                        key={field.id}
                        className="border border-neutral-800 bg-neutral-950 rounded-lg p-3 flex items-center justify-between"
                        style={{
                          borderLeftColor: accentColor,
                          borderLeftWidth: 4,
                        }}
                      >
                        <span className="font-medium text-sm text-neutral-200">
                          {field.uniqueIdentifier} - {field.id}
                        </span>
                        <GripVerticalIcon className="size-4 text-neutral-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          if (source.type === 'item') {
            const sectionIndex = sections.findIndex((s) =>
              s.fields.some((f) => f.id === source.id),
            )
            const field = sections[sectionIndex]?.fields.find(
              (f) => f.id === source.id,
            )
            if (!field) return null
            const accentColor =
              ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

            return (
              <div
                className="border border-neutral-800 bg-neutral-950 rounded-lg p-3 shadow-2xl flex items-center justify-between cursor-grabbing"
                style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
              >
                <span className="font-medium text-sm text-neutral-200">
                  {field.uniqueIdentifier} - {field.id}
                </span>
                <GripVerticalIcon className="size-4 text-neutral-500" />
              </div>
            )
          }

          return null
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}
