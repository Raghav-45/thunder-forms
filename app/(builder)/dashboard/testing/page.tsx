'use client'

import React, { memo, useCallback, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import { Feedback, PointerSensor, KeyboardSensor } from '@dnd-kit/dom'
import { DragDropEventHandlers } from '@dnd-kit/react'
import { GripVerticalIcon } from 'lucide-react'

function createRange(length: number) {
  return Array.from({ length }, (_, i) => i + 1)
}

const ITEM_COUNT = 6

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
  const { handleRef, ref, isDragging } = useSortable({
    id,
    group,
    accept: 'item',
    type: 'item',
    plugins: [Feedback.configure({ feedback: 'clone' })],
    index,
    data: { group },
  })

  return (
    <div
      ref={ref as any}
      className={`border border-neutral-800 bg-neutral-950 rounded-lg p-3 transition-opacity flex items-center justify-between ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
    >
      <span className="font-medium text-sm text-neutral-200">{id}</span>
      <button ref={handleRef as any} className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300">
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
  const { handleRef, isDragging, ref } = useSortable({
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
        isDragging ? 'opacity-50' : ''
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

export default function App() {
  const [items, setItems] = useState({
    A: createRange(ITEM_COUNT).map((id) => `A${id}`),
    B: createRange(ITEM_COUNT).map((id) => `B${id}`),
    C: createRange(ITEM_COUNT).map((id) => `C${id}`),
    D: [],
  })
  const [columns] = useState(Object.keys(items))
  const snapshot = useRef(structuredClone(items))

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={useCallback<DragDropEventHandlers['onDragStart']>(() => {
        snapshot.current = structuredClone(items)
      }, [items])}
      onDragOver={useCallback<DragDropEventHandlers['onDragOver']>((event) => {
        const { source } = event.operation

        if (source && source.type === 'column') {
          return
        }

        setItems((items) => move(items, event))
      }, [])}
      onDragEnd={useCallback<DragDropEventHandlers['onDragEnd']>((event) => {
        if (event.canceled) {
          setItems(snapshot.current)
          return
        }
      }, [])}
    >
      <div className="p-8 max-w-2xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
        <h1 className="text-3xl font-bold mb-8">Drag & Drop Testing</h1>
        <div className="space-y-4 pb-8">
          {columns.map((column, columnIndex) => {
          const rows = items[column as keyof typeof items]

          return (
            <SortableColumn
              key={column}
              id={column}
              index={columnIndex}
              rows={rows}
            />
          )
        })}
        </div>
      </div>
    </DragDropProvider>
  )
}
