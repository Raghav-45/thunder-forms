'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'
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
import type { PropsWithChildren, ReactNode } from 'react'
import { forwardRef, memo, use, useCallback, useRef, useState } from 'react'

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

// ---------------------------------------------------------------------
// Presentational components. These know nothing about dnd-kit — they're
// just "what an item/section looks like." Used both by the live sortable
// tree (wrapped with drag behavior below) and by DragOverlay (rendered
// bare, as a static floating clone). One definition of the UI, two call
// sites — instead of the overlay hand-maintaining a visual copy.
// ---------------------------------------------------------------------

interface ItemCardProps {
  id: string
  label: string
  field: FieldConfig
  accentColor: string
  // 'ghost'    -> this is the item currently being dragged FROM (faded, still in place)
  // 'floating' -> this is the DragOverlay clone following the cursor
  state?: 'ghost' | 'floating'
  // Only passed by the live sortable wrapper. Its presence is what turns
  // the grip icon into an actual drag handle vs. a decorative icon.
  handleRef?: React.Ref<HTMLButtonElement>
}

const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(function ItemCard(
  { id, label, field, accentColor, state, handleRef },
  ref,
) {
  const FieldComponent = getFieldComponent(field.uniqueIdentifier)
  return (
    <div
      ref={ref}
      className={`border border-neutral-800 bg-neutral-950 rounded-lg p-3 flex items-center justify-between transition-opacity ${
        state === 'ghost' ? 'opacity-30' : ''
      } ${state === 'floating' ? 'shadow-2xl cursor-grabbing' : ''}`}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
    >
      <FieldComponent
        field={field as never}
        value={undefined}
        onChange={(value) => console.log(field.id, value)}
      />
      {handleRef ? (
        <button
          ref={handleRef}
          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      ) : (
        <GripVerticalIcon className="size-4 text-neutral-500" />
      )}
    </div>
  )
})

interface SectionCardProps {
  id: string
  isEmpty: boolean
  state?: 'ghost' | 'floating'
  // Only passed by the live sortable wrapper — same idea as ItemCard.
  handleRef?: React.Ref<HTMLDivElement>
  children?: ReactNode
}

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard({ id, isEmpty, state, handleRef, children }, ref) {
    return (
      <div
        ref={ref}
        className={`border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 transition-opacity ${
          state === 'ghost' ? 'opacity-30' : ''
        } ${state === 'floating' ? 'shadow-2xl cursor-grabbing' : ''}`}
      >
        <div
          ref={handleRef}
          className={`flex items-center gap-2 text-sm font-medium text-neutral-400 ${
            handleRef ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <GripVerticalIcon className="size-4" />
          <span>Section - [{id}]</span>
        </div>

        {isEmpty ? (
          <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
            Drop fields here
          </div>
        ) : (
          <div className="space-y-3 flex-1">{children}</div>
        )}
      </div>
    )
  },
)

// ---------------------------------------------------------------------
// Sortable wrappers. Thin: call useSortable, forward its ref/handleRef
// into the presentational component above. No layout/styling lives here.
// ---------------------------------------------------------------------

interface SortableItemProps {
  id: string
  label: string
  field: FieldConfig
  column: string
  index: number
  accentColor: string
}

const SortableItem = memo(function SortableItem({
  id,
  label,
  field,
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
    <ItemCard
      ref={ref as any}
      id={id}
      label={label}
      field={field}
      accentColor={accentColor}
      state={isDragSource ? 'ghost' : undefined}
      handleRef={handleRef as any}
    />
  )
})

interface SortableSectionProps {
  id: string
  index: number
  fields: FieldConfig[]
  accentColor: string
}

const SortableSection = memo(function SortableSection({
  fields,
  id,
  index,
  accentColor,
}: PropsWithChildren<SortableSectionProps>) {
  const { handleRef, isDragging, isDragSource, ref } = useSortable({
    id,
    accept: ['section', 'item'],
    collisionPriority: CollisionPriority.Low,
    type: 'section',
    index,
  })

  return (
    <SectionCard
      ref={ref as any}
      id={id}
      isEmpty={fields.length === 0}
      state={isDragSource ? 'ghost' : undefined}
      handleRef={handleRef as any}
    >
      {fields.map((field, fieldIndex) => (
        <SortableItem
          key={field.id}
          id={field.id}
          label={field.uniqueIdentifier}
          field={field}
          column={id}
          index={fieldIndex}
          accentColor={accentColor}
        />
      ))}
    </SectionCard>
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
        // sections: [generateNewSection()],
        sections: [],
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

        if (source && source.type === 'section') {
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
            <SortableSection
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

          if (source.type === 'section') {
            const sectionIndex = sections.findIndex((s) => s.id === source.id)
            const section = sections[sectionIndex]
            if (!section) return null
            const accentColor =
              ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

            return (
              <SectionCard
                id={section.id}
                isEmpty={section.fields.length === 0}
                state="floating"
              >
                {section.fields.map((field) => (
                  <ItemCard
                    key={field.id}
                    id={field.id}
                    label={field.uniqueIdentifier}
                    field={field}
                    accentColor={accentColor}
                  />
                ))}
              </SectionCard>
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
              <ItemCard
                id={field.id}
                label={field.uniqueIdentifier}
                field={field}
                accentColor={accentColor}
                state="floating"
              />
            )
          }

          return null
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}
