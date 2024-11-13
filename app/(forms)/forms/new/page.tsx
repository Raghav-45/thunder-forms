'use client'

import React, { useState } from 'react'
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
  X,
} from 'lucide-react'
import { FormElementPreview } from '@/components/FormElementPreview'
import { createForm, updateFormbyId } from '@/lib/dbUtils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

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

const DraggableFormElementBase = React.forwardRef<
  HTMLDivElement,
  {
    element: FieldType
    value: FieldType
    isDragging?: boolean
    isSelected?: boolean
    onClick?: () => void
  }
>(({ element, isDragging, isSelected, onClick, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      onClick={onClick}
      className={cn(
        'relative p-4 border rounded-md mb-4 cursor-move transition-colors',
        isDragging ? 'opacity-50 border-dashed z-50' : 'opacity-100',
        isSelected ? 'border-primary border-2' : 'hover:border-primary',
        'bg-background'
      )}
    >
      <div className="pr-6">
        <FormElementPreview type={element.type} label={element.label} />
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  )
})

DraggableFormElementBase.displayName = 'DraggableFormElement'
const DraggableFormElement = motion(DraggableFormElementBase)

const ElementEditor = ({
  element,
  onUpdate,
  onClose,
}: {
  element: FieldType
  onUpdate: (id: string, updates: Partial<FieldType>) => void
  onClose: () => void
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Element</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Separator />
      <div className="space-y-4">
        <div>
          <Label htmlFor="elementLabel">Label</Label>
          <Input
            id="elementLabel"
            value={element.label}
            onChange={(e) => onUpdate(element.id, { label: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="elementPlaceholder">Placeholder</Label>
          <Input
            id="elementPlaceholder"
            value={element.placeholder}
            onChange={(e) =>
              onUpdate(element.id, { placeholder: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  )
}

export default function FormBuilder() {
  const [formElements, setFormElements] = useState<FieldType[]>([])
  const [formName, setFormName] = useState('New form')
  const [formDescription, setFormDescription] = useState(
    'Lorem ipsum dolor sit amet'
  )
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  )

  const [currentFormId, setCurrentFormId] = useState<string | null>(null)

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

  const handleReorder = (reorderedElements: FieldType[]) => {
    setFormElements(
      reorderedElements.map((element, index) => ({
        ...element,
        order: index,
      }))
    )
  }

  const handleElementUpdate = (id: string, updates: Partial<FieldType>) => {
    setFormElements((prev) =>
      prev.map((element) =>
        element.id === id ? { ...element, ...updates } : element
      )
    )
  }

  const handleElementSelect = (id: string) => {
    setSelectedElementId(id)
  }

  const selectedElement = formElements.find(
    (element) => element.id === selectedElementId
  )

  const handlSubmit = () => {
    if (!formName) {
      toast.error('Form name is required')
      return
    }
    if (!currentFormId) {
      createForm(formName, formDescription, formElements).then((e) => {
        setCurrentFormId(e)
        toast.success('New Form created successfully!')
      })
    } else {
      updateFormbyId(currentFormId, formName, formDescription, formElements)
      toast.success('Form saved successfully!')
    }
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
            <Input
              readOnly
              value={`https://localhost:3000/forms/${
                currentFormId ?? 'new-form'
              }`}
            />
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
          <CardContent className="p-6">
            {formElements.length > 0 ? (
              <Reorder.Group
                axis="y"
                values={formElements}
                onReorder={handleReorder}
                className="space-y-4"
              >
                <AnimatePresence>
                  {formElements.map((element) => (
                    <Reorder.Item
                      key={element.id}
                      value={element}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                        cursor: 'grabbing',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <DraggableFormElement
                        element={element}
                        value={element}
                        isSelected={selectedElementId === element.id}
                        onClick={() => handleElementSelect(element.id)}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
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
          {selectedElement ? (
            <ElementEditor
              element={selectedElement}
              onUpdate={handleElementUpdate}
              onClose={() => setSelectedElementId(null)}
            />
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
