'use client'

import { EditFieldForm } from '@/components/edit-field-form'
import { FormFieldOrGroup } from '@/components/field-item'
import { FieldSelector } from '@/components/field-selector'
import { FormPreview } from '@/components/form-preview'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { defaultFieldConfig } from '@/constants'
import { FormFieldType } from '@/types/types'
import { useState } from 'react'

export default function FormBuilder() {
  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])
  const [selectedField, setSelectedField] = useState<FormFieldType | null>(null)
  const [isEditingWindowOpen, setIsEditingWindowOpen] = useState(false)

  const [whichTabIsOpen, setWhichTabIsOpen] = useState<'editing' | 'preview'>(
    'editing'
  )

  const addFormField = (variant: string, index: number) => {
    // Generate a unique field name using a random number
    const newFieldName = `name_${Math.random().toString().slice(-10)}`

    // Retrieve default configuration (label, description, placeholder) for the selected field variant
    const { label, description, placeholder } = defaultFieldConfig[variant] || {
      label: '',
      description: '',
      placeholder: '',
    }

    const newField: FormFieldType = {
      checked: true, // Field is initially checked
      description: description || '', // Use default or fallback to an empty string
      disabled: false, // Field is enabled by default
      label: label || newFieldName, // Use label from config or fallback to generated field name
      name: newFieldName, // Unique field name
      onChange: () => {}, // Placeholder for the onChange handler
      onSelect: () => {}, // Placeholder for the onSelect handler
      placeholder: placeholder || 'Placeholder', // Default placeholder if not provided
      required: true, // Field is required by default
      rowIndex: index, // Index to track field's position
      setValue: () => {}, // Placeholder for the setValue handler
      type: '', // Type of the field (left empty for now)
      value: '', // Default value (empty)
      variant, // Field type/variant (e.g., text, checkbox, etc.)
    }
    // Appending the new field to the existing formFields
    setFormFields([...formFields, newField])
  }

  // const findFieldPath = (
  //   fields: FormFieldOrGroup[],
  //   name: string
  // ): number[] | null => {
  //   const search = (
  //     currentFields: FormFieldOrGroup[],
  //     currentPath: number[]
  //   ): number[] | null => {
  //     for (let i = 0; i < currentFields.length; i++) {
  //       const field = currentFields[i]
  //       if (Array.isArray(field)) {
  //         const result = search(field, [...currentPath, i])
  //         if (result) return result
  //       } else if (field.name === name) {
  //         return [...currentPath, i]
  //       }
  //     }
  //     return null
  //   }
  //   return search(fields, [])
  // }

  // const updateFormField = (path: number[], updates: Partial<FormFieldType>) => {
  //   const updatedFields = JSON.parse(JSON.stringify(formFields)) // Deep clone
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   let current: any = updatedFields
  //   for (let i = 0; i < path.length - 1; i++) {
  //     current = current[path[i]]
  //   }
  //   current[path[path.length - 1]] = {
  //     ...current[path[path.length - 1]],
  //     ...updates,
  //   }
  //   setFormFields(updatedFields)
  // }

  const openEditingWindow = (field: FormFieldType) => {
    setSelectedField(field)
    setIsEditingWindowOpen(true)
  }

  // const handleSaveField = (updatedField: FormFieldType) => {
  //   if (selectedField) {
  //     const path = findFieldPath(formFields, selectedField.name)
  //     if (path) {
  //       updateFormField(path, updatedField)
  //     }
  //   }
  //   setIsDialogOpen(false)
  // }

  const removeFormField = (fieldToRemove: FormFieldType) => {
    setFormFields((prevFields) =>
      prevFields.filter((field) => {
        if (Array.isArray(field)) {
          return field.every((subField) => subField.name !== fieldToRemove.name)
        } else {
          return field.name !== fieldToRemove.name
        }
      })
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
              //   value={formName}
              //   onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              placeholder="Enter description"
              className="max-h-24"
              //   value={formDescription}
              //   onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>Form Link</Label>
            <Input
              readOnly
              //   value={`https://localhost:3000/forms/${
              //     currentFormId ?? 'new-form'
              //   }`}
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="flex-1 p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        // onDrop={handleDrop}
      >
        <div className="flex flex-row justify-between">
          <h2 className="text-3xl font-bold mb-6">Form Preview</h2>
          <Select
            onValueChange={(e) => setWhichTabIsOpen(e as 'editing' | 'preview')}
            defaultValue={whichTabIsOpen}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Editing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">Preview</SelectItem>
              <SelectItem value="editing">Editing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="min-h-[600px] border-2 border-dashed border-muted">
          <CardContent className="p-6">
            {formFields.length > 0 ? (
              <div className="overflow-y-auto flex-1">
                <FormPreview
                  formFields={formFields}
                  onClickEdit={(field) => openEditingWindow(field)}
                  onClickRemove={(field) => removeFormField(field)}
                  behaveAsPreview={whichTabIsOpen === 'preview'}
                />
              </div>
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
            <div className="flex flex-row">
              <FieldSelector
                addFormField={(variant: string, index: number = 0) =>
                  addFormField(variant, index)
                }
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* <EditFieldDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        field={selectedField}
        onSave={handleSaveField}
      /> */}
      <EditFieldForm
        isOpen={isEditingWindowOpen}
        onClose={() => setIsEditingWindowOpen(false)}
        field={selectedField}
        onEditingField={(editedField) => {
          // handleSaveField(editedField)
        }}
      />
    </div>
  )
}
