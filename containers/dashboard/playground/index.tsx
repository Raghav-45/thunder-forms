'use client'

import React, { useRef, useState } from 'react'
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { Feedback, PointerSensor, KeyboardSensor } from '@dnd-kit/dom'
import { CollisionPriority } from '@dnd-kit/abstract'
import { GripVerticalIcon } from 'lucide-react'

type Field = { id: string; type: string; label?: string }
type Section = { id: string; title: string; fields: Field[] }

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

const INITIAL_STATE: Section[] = [
  { id: 'section-1', title: 'Section 1', fields: [] },
  {
    id: 'section-2',
    title: 'Section 2',
    fields: [{ id: 'field-1', type: 'Text field' }],
  },
  {
    id: 'section-3',
    title: 'Section 3',
    fields: [{ id: 'field-2', type: 'Textbox', label: 'I agree with terms' }],
  },
]

export default function PlaygroundPage() {
  const [sections, setSections] = useState(INITIAL_STATE)
  const snapshot = useRef<Section[] | null>(null)

  const handleDragStart = () => {
    snapshot.current = JSON.parse(JSON.stringify(sections))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation
    if (!source || !target || !isSortable(source) || !isSortable(target)) {
      return
    }

    // We rely on optimistic sorting for sections, no state update needed during drag over
    if (source.type === 'section') return

    if (source.type === 'field') {
      const sourceSectionId = source.group
      let targetSectionId = target.group

      if (target.type === 'section') {
        targetSectionId = target.id
      }

      if (!targetSectionId || sourceSectionId === targetSectionId) return

      // Moving field across sections during drag over
      setSections((prev) => {
        const sourceSectionIndex = prev.findIndex((s) => s.id === sourceSectionId)
        const targetSectionIndex = prev.findIndex((s) => s.id === targetSectionId)

        if (sourceSectionIndex === -1 || targetSectionIndex === -1) return prev

        const newSections = prev.map((s) => ({ ...s, fields: [...s.fields] }))
        const sourceFields = newSections[sourceSectionIndex].fields
        const targetFields = newSections[targetSectionIndex].fields

        const sourceIndex = source.initialIndex
        const [movedField] = sourceFields.splice(sourceIndex, 1)

        let targetIndex =
          target.type === 'field' ? target.index : targetFields.length
        if (targetIndex === undefined) targetIndex = targetFields.length

        targetFields.splice(targetIndex, 0, movedField)
        return newSections
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { operation, canceled } = event
    const { source, target } = operation

    if (canceled) {
      if (snapshot.current) setSections(snapshot.current)
      return
    }

    if (!source || !isSortable(source)) return

    if (source.type === 'section') {
      const targetId = target?.id
      if (!targetId || targetId === source.id) return

      setSections((prev) => {
        const initialIndex = prev.findIndex(s => s.id === source.id)
        const targetIndex = prev.findIndex(s => s.id === targetId)
        
        if (initialIndex === -1 || targetIndex === -1 || initialIndex === targetIndex) return prev

        const newSections = [...prev]
        const [moved] = newSections.splice(initialIndex, 1)
        newSections.splice(targetIndex, 0, moved)
        return newSections
      })
    }

    if (source.type === 'field') {
      const { initialGroup, group } = source
      
      // If it stayed in the same group, we apply the final sort order.
      // If it changed groups, we already updated the state in onDragOver, so we do nothing!
      if (initialGroup === group) {
        const targetId = target?.id
        if (!targetId || targetId === source.id) return

        setSections((prev) => {
          const sectionIndex = prev.findIndex((s) => s.id === group)
          if (sectionIndex === -1) return prev

          const newSections = prev.map((s) => ({ ...s, fields: [...s.fields] }))
          const fields = newSections[sectionIndex].fields
          
          const initialIndex = fields.findIndex(f => f.id === source.id)
          const targetIndex = fields.findIndex(f => f.id === targetId)
          
          if (initialIndex === -1 || targetIndex === -1 || initialIndex === targetIndex) return prev

          const [moved] = fields.splice(initialIndex, 1)
          fields.splice(targetIndex, 0, moved)
          return newSections
        })
      }
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
      <h1 className="text-3xl font-bold mb-8">Drag & Drop Playground</h1>
      <p className="text-neutral-400 mb-8">
        Test robust section and field dragging here.
      </p>

      <DragDropProvider
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SortableSection key={section.id} section={section} index={index} />
          ))}
        </div>
      </DragDropProvider>
    </div>
  )
}

function SortableSection({ section, index }: { section: Section; index: number }) {
  const { ref, handleRef, isDragging } = useSortable({
    id: section.id,
    index,
    type: 'section',
    accept: ['section', 'field'],
    collisionPriority: CollisionPriority.Low,
    plugins: [Feedback.configure({ feedback: 'clone' })],
  })

  return (
    <div
      ref={ref}
      className={`border border-neutral-800 bg-neutral-900 rounded-xl p-4 transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        ref={handleRef}
        className="flex items-center gap-2 mb-4 text-sm font-medium text-neutral-400 cursor-grab active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
        <span>{section.title}</span>
      </div>

      {section.fields.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
          Drag fields here
        </div>
      ) : (
        <div className="space-y-3">
          {section.fields.map((field, fieldIndex) => (
            <SortableField
              key={field.id}
              field={field}
              index={fieldIndex}
              sectionId={section.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SortableField({
  field,
  index,
  sectionId,
}: {
  field: Field
  index: number
  sectionId: string
}) {
  const { ref, isDragging } = useSortable({
    id: field.id,
    index,
    type: 'field',
    accept: 'field',
    group: sectionId,
    plugins: [Feedback.configure({ feedback: 'clone' })],
  })

  return (
    <div
      ref={ref}
      className={`border border-neutral-800 bg-neutral-950 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm">{field.type}</span>
        {field.label && (
          <span className="text-xs text-neutral-400 mt-1">{field.label}</span>
        )}
      </div>
    </div>
  )
}
