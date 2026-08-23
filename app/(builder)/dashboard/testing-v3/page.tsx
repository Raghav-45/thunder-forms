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

interface SortableItemProps {
  id: string
  column: string
  index: number
  accentColor: string
}

const COLORS: Record<string, string> = {
  A: '#7193f1',
  B: '#FF851B',
  C: '#2ECC40',
  D: '#ff3680',
}

const SortableItem = memo(function SortableItem({
  id,
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
      <span className="font-medium text-sm text-neutral-200">{id}</span>
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
  rows: string[]
}

const SortableColumn = memo(function SortableColumn({
  rows,
  id,
  index,
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
        <span>Column {id}</span>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
          Drop items here
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {rows.map((itemId, itemIndex) => (
            <SortableItem
              key={itemId}
              id={itemId}
              column={id}
              index={itemIndex}
              accentColor={COLORS[id]}
            />
          ))}
        </div>
      )}
    </div>
  )
})

interface Column {
  id: string
  items: string[]
}

const initialColumns: Column[] = [
  { id: 'A', items: Array.from({ length: 6 }, (_, i) => `A${i + 1}`) },
  { id: 'B', items: Array.from({ length: 6 }, (_, i) => `B${i + 1}`) },
  { id: 'C', items: Array.from({ length: 6 }, (_, i) => `C${i + 1}`) },
  { id: 'D', items: [] },
]

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface IFormStructure {
  pages: {
    sections: {
      id: string
      fields: FieldConfig[]
    }[]
  }[]
}

const generateNewSection = (): { id: string; fields: FieldConfig[] } => ({
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

  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const snapshot = useRef(structuredClone(columns))

  function handleAddSection() {
    // setFormStructure((prev) => {
    //   const newSection = generateNewSection()
    //   const updatedPages = [...prev.pages]
    //   updatedPages[0].sections.push(newSection)
    //   return { ...prev, pages: updatedPages }
    // })
    const randomUniqueIdentifier = AVAILABLE_FIELDS[
      Math.floor(Math.random() * AVAILABLE_FIELDS.length)
    ] as avaliableFieldsType
    const newField = createDefaultFieldConfig(randomUniqueIdentifier)
    setColumns((prev) => [
      { id: newField.id, items: [newField.uniqueIdentifier] },
      ...prev,
    ])
  }

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={useCallback<DragDropEventHandlers['onDragStart']>(() => {
        snapshot.current = structuredClone(columns)
      }, [columns])}
      onDragOver={useCallback<DragDropEventHandlers['onDragOver']>((event) => {
        const { source } = event.operation

        if (source && source.type === 'column') {
          return
        }

        setColumns((columns) => {
          // `move` expects a Record<groupId, items[]>, so we project the
          // array into that shape, run the move, then project it back.
          const record = Object.fromEntries(columns.map((c) => [c.id, c.items]))
          const updated = move(record, event)

          return columns.map((c) => ({
            ...c,
            items: updated[c.id] ?? c.items,
          }))
        })
      }, [])}
      onDragEnd={useCallback<DragDropEventHandlers['onDragEnd']>((event) => {
        if (event.canceled) {
          setColumns(snapshot.current)
          return
        }
      }, [])}
    >
      <div className="p-8 max-w-2xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
        <h1 className="text-3xl font-bold mb-8">Drag & Drop Testing</h1>
        <button onClick={() => handleAddSection()}>Add Field</button>
        <div className="space-y-4 pb-8">
          {columns.map((column, columnIndex) => (
            <SortableColumn
              key={column.id}
              id={column.id}
              index={columnIndex}
              rows={column.items}
            />
          ))}
        </div>
      </div>

      {/* <DragOverlay>
        {(source) => {
          const sourceId = String(source.id)
          const column = sourceId[0] as keyof typeof COLORS
          const accentColor = COLORS[column]

          if (source.type === 'column') {
            const columnRows =
              columns.find((c) => c.id === sourceId)?.items ?? []
            return (
              <div className="border border-neutral-700 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 shadow-2xl opacity-95">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 cursor-grabbing">
                  <GripVerticalIcon className="size-4" />
                  <span>Column {sourceId}</span>
                </div>
                <div className="space-y-3">
                  {columnRows.map((itemId) => (
                    <div
                      key={itemId}
                      className="border border-neutral-800 bg-neutral-950 rounded-lg p-3 flex items-center justify-between"
                      style={{
                        borderLeftColor: accentColor,
                        borderLeftWidth: 4,
                      }}
                    >
                      <span className="font-medium text-sm text-neutral-200">
                        {itemId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div
              className="border border-neutral-700 bg-neutral-950 rounded-lg p-3 flex items-center justify-between shadow-2xl opacity-95 cursor-grabbing"
              style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
            >
              <span className="font-medium text-sm text-neutral-200">
                {sourceId}
              </span>
              <GripVerticalIcon className="size-4 text-neutral-500" />
            </div>
          )
        }}
      </DragOverlay> */}
    </DragDropProvider>
  )
}
