'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Pencil,
  Hash,
  Mail,
  CheckSquare,
  CircleDot,
  ChevronDown,
  FileText,
  GripVertical,
} from 'lucide-react'
import { FormElementPreview } from '@/components/FormElementPreview'
import { createForm } from '@/lib/dbUtils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const FORM_ELEMENTS_LIBRARY = [
  { type: 'text', label: 'Text Input', icon: Pencil },
  { type: 'number', label: 'Number Input', icon: Hash },
  { type: 'email', label: 'Email Input', icon: Mail },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Group', icon: CircleDot },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'textarea', label: 'Text Area', icon: FileText },
]

const DraggableElement = ({
  type,
  label,
  icon: Icon,
  onDragStart,
}: {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onDragStart: (e: React.DragEvent, type: string, label: string) => void
}) => (
  <Button
    variant="outline"
    className="w-full justify-start mb-2"
    draggable
    onDragStart={(e) => onDragStart(e, type, label)}
  >
    <Icon className="w-4 h-4 mr-2" />
    <span>{label}</span>
  </Button>
)

const DraggableFormElement = ({
  element,
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}: {
  element: FieldType
  index: number
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
  isDragging: boolean
}) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'relative p-4 border rounded-md mb-4 cursor-move transition-colors',
        isDragging ? 'opacity-50 border-dashed' : 'opacity-100',
        'hover:border-primary'
      )}
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="pl-6">
        <FormElementPreview type={element.type} label={element.label} />
      </div>
    </div>
  )
}

export default function FormBuilder() {
  const [formElements, setFormElements] = useState<FieldType[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [formName, setFormName] = useState('New form')
  const [formDescription, setFormDescription] = useState(
    'Lorem ipsum dolor sit amet'
  )

  const handleDragStart = (e: React.DragEvent, type: string, label: string) => {
    e.dataTransfer.setData('elementType', type)
    e.dataTransfer.setData('elementLabel', label)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('elementType')
    const label = e.dataTransfer.getData('elementLabel')

    if (type && label) {
      setFormElements((prev) => [
        ...prev,
        {
          id: `${type}-${Date.now()}`,
          type,
          label,
          order: prev.length,
          placeholder: `Enter ${label.toLowerCase()}`,
        },
      ])
    }
  }

  const handleFormElementDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleFormElementDragEnter = (index: number) => {
    if (draggedIndex === null) return

    setFormElements((prev) => {
      const newElements = [...prev]
      const draggedElement = newElements[draggedIndex]

      // Remove the element from its original position
      newElements.splice(draggedIndex, 1)
      // Insert it at the new position
      newElements.splice(index, 0, draggedElement)

      // Update order property for all elements
      return newElements.map((element, idx) => ({
        ...element,
        order: idx,
      }))
    })

    setDraggedIndex(index)
  }

  const handleFormElementDragEnd = () => {
    setDraggedIndex(null)
  }

  const handlSubmit = () => {
    if (!formName) {
      toast.error('Form name is required')
      return
    }
    createForm(formName, formDescription, formElements).then(() =>
      toast.success('Form saved successfully!')
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="w-80 border-l rounded-none h-screen overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Form Details</h2>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formName">Form Name</Label>
            <Input
              id="formName"
              placeholder="Enter form name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              placeholder="Enter description"
              className="max-h-24"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>Form Link</Label>
            <Input readOnly value={`https://localhost:3000/forms/new-form`} />
          </div>
        </CardContent>
      </Card>

      <div
        className="flex-1 p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <h2 className="text-3xl font-bold mb-6">Form Preview</h2>
        <Card className="min-h-[600px] border-2 border-dashed border-muted">
          <CardContent className="p-6 space-y-4">
            {formElements.length > 0 ? (
              formElements.map((element, index) => (
                <DraggableFormElement
                  key={element.id}
                  element={element}
                  index={index}
                  onDragStart={handleFormElementDragStart}
                  onDragEnter={handleFormElementDragEnter}
                  onDragEnd={handleFormElementDragEnd}
                  isDragging={index === draggedIndex}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>Drag elements here to build your form</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side bar */}
      <Card className="w-80 border-l rounded-none h-screen overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Elements</h2>
          <Separator className="my-4" />
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {FORM_ELEMENTS_LIBRARY.map((element) => (
              <DraggableElement
                key={element.type}
                type={element.type}
                label={element.label}
                icon={element.icon}
                onDragStart={handleDragStart}
              />
            ))}
            <Button
              className="w-full mt-8"
              variant="secondary"
              onClick={handlSubmit}
            >
              Save Changes
            </Button>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
