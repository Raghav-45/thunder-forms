'use client'

import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/config/firebaseConfig'

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

async function createForm(data: FormElement[]) {
  const docRef = await addDoc(collection(db, 'forms'), { data: data })
  return docRef.id
}

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

export const FormElementPreview = ({
  type,
  label,
}: {
  type: string
  label: string
}) => {
  switch (type) {
    case 'text':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Text</Label>
          <Input type="text" id={`${type}-${label}`} placeholder="Text" />
        </div>
      )
    case 'email':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Email</Label>
          <Input type="email" id={`${type}-${label}`} placeholder="Email" />
        </div>
      )
    case 'number':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Number</Label>
          <Input type="number" id={`${type}-${label}`} placeholder="Number" />
        </div>
      )
    case 'textarea':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`textarea-${label}`}>Textarea</Label>
          <Textarea
            id={`textarea-${label}`}
            placeholder="Type your message here."
          />
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox id={`checkbox-${label}`} />
          <label
            htmlFor={`checkbox-${label}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </label>
        </div>
      )
    case 'radio':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Radio</Label>
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">Option One</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" />
              <Label htmlFor="option-two">Option Two</Label>
            </div>
          </RadioGroup>
        </div>
      )
    case 'select':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Theme</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
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

  useEffect(() => {
    if (formElements.length > 0) {
      console.log('elements: ', formElements)
    }
  }, [formElements])

  const handlSubmit = () => {
    createForm(formElements)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div
        className="flex-1 p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <h2 className="text-3xl font-bold mb-6">Form Preview</h2>
        <Card className="min-h-[600px] border-2 border-dashed border-muted">
          <CardContent className="p-6 space-y-4">
            {formElements.length > 0 ? (
              formElements.map((element) => (
                <FormElementPreview
                  key={element.id}
                  type={element.type}
                  label={element.label}
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

      <Card className="w-80 border-l rounded-none h-screen overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Form Elements</h2>
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
