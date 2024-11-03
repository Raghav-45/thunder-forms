import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'

function DraggableFormElement({ id, children }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab"
    >
      {children}
    </div>
  )
}
