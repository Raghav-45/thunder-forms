// app/form-builder/page.tsx

'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Pencil,
  Hash,
  Mail,
  CheckSquare,
  CircleDot,
  ChevronDown,
  FileText,
} from 'lucide-react'

const FORM_ELEMENTS_LIBRARY = [
  { type: 'text', label: 'Text Input', icon: Pencil },
  { type: 'number', label: 'Number Input', icon: Hash },
  { type: 'email', label: 'Email Input', icon: Mail },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Group', icon: CircleDot },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'textarea', label: 'Text Area', icon: FileText },
]

interface FormElement {
  id: string
  type: string
  label: string
}

const DraggableElement = ({ type, label, icon: Icon, onDragStart }: any) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, type, label)}
    className="flex items-center gap-2 p-3 mb-2 bg-secondary rounded-lg cursor-grab active:cursor-grabbing hover:bg-secondary/80 transition-colors"
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </div>
)

const FormElementPreview = ({
  type,
  label,
}: {
  type: string
  label: string
}) => {
  switch (type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <div className="mb-4">
          <Label>{label}</Label>
          <Input type={type} placeholder={`Enter ${label.toLowerCase()}`} />
        </div>
      )
    case 'textarea':
      return (
        <div className="mb-4">
          <Label>{label}</Label>
          <Textarea placeholder="Enter text" />
        </div>
      )
    case 'checkbox':
      return (
        <div className="mb-4 flex items-center space-x-2">
          <Checkbox />
          <Label>{label}</Label>
        </div>
      )
    case 'radio':
      return (
        <div className="mb-4">
          <Label>{label}</Label>
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" />
              <Label>Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" />
              <Label>Option 2</Label>
            </div>
          </RadioGroup>
        </div>
      )
    case 'select':
      return (
        <div className="mb-4">
          <Label>{label}</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    default:
      return null
  }
}

export default function FormBuilder() {
  const [formElements, setFormElements] = useState<FormElement[]>([])

  const handleDragStart = (e: React.DragEvent, type: string, label: string) => {
    e.dataTransfer.setData('elementType', type)
    e.dataTransfer.setData('elementLabel', label)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('elementType')
    const label = e.dataTransfer.getData('elementLabel')
    setFormElements((prev) => [
      ...prev,
      { id: `${type}-${Date.now()}`, type, label },
    ])
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div
        className="flex-1 p-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <h2 className="text-2xl font-bold mb-6">Form Preview</h2>
        <Card className="min-h-[600px] border-2 border-dashed">
          <CardContent className="p-6">
            {formElements.length > 0 ? (
              formElements.map((element) => (
                <FormElementPreview
                  key={element.id}
                  type={element.type}
                  label={element.label}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground mt-8">
                Drag elements here to build your form
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="w-64 border-l">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-4">Form Elements</h2>
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
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
