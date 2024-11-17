'use client'

import { EditFieldDialog } from '@/components/edit-field-dialog'
import { FormFieldOrGroup } from '@/components/field-item'
import { FieldSelector } from '@/components/field-selector'
import { FormFieldList } from '@/components/form-field-list'
import { FormPreview } from '@/components/form-preview'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { defaultFieldConfig } from '@/constants'
import { useMediaQuery } from '@/hooks/use-media-query'
import { FormFieldType } from '@/types/types'
import { useState } from 'react'

export default function FormBuilder() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])
  const [selectedField, setSelectedField] = useState<FormFieldType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addFormField = (variant: string, index: number) => {
    const newFieldName = `name_${Math.random().toString().slice(-10)}`

    const { label, description, placeholder } = defaultFieldConfig[variant] || {
      label: '',
      description: '',
      placeholder: '',
    }

    const newField: FormFieldType = {
      checked: true,
      description: description || '',
      disabled: false,
      label: label || newFieldName,
      name: newFieldName,
      onChange: () => {},
      onSelect: () => {},
      placeholder: placeholder || 'Placeholder',
      required: true,
      rowIndex: index,
      setValue: () => {},
      type: '',
      value: '',
      variant,
    }
    setFormFields([...formFields, newField])
  }

  const findFieldPath = (
    fields: FormFieldOrGroup[],
    name: string
  ): number[] | null => {
    const search = (
      currentFields: FormFieldOrGroup[],
      currentPath: number[]
    ): number[] | null => {
      for (let i = 0; i < currentFields.length; i++) {
        const field = currentFields[i]
        if (Array.isArray(field)) {
          const result = search(field, [...currentPath, i])
          if (result) return result
        } else if (field.name === name) {
          return [...currentPath, i]
        }
      }
      return null
    }
    return search(fields, [])
  }

  const updateFormField = (path: number[], updates: Partial<FormFieldType>) => {
    const updatedFields = JSON.parse(JSON.stringify(formFields)) // Deep clone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = updatedFields
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = {
      ...current[path[path.length - 1]],
      ...updates,
    }
    setFormFields(updatedFields)
  }

  const openEditDialog = (field: FormFieldType) => {
    setSelectedField(field)
    setIsDialogOpen(true)
  }

  const handleSaveField = (updatedField: FormFieldType) => {
    if (selectedField) {
      const path = findFieldPath(formFields, selectedField.name)
      if (path) {
        updateFormField(path, updatedField)
      }
    }
    setIsDialogOpen(false)
  }

  const FieldSelectorWithSeparator = ({
    addFormField,
  }: {
    addFormField: (variant: string, index?: number) => void
  }) => (
    <div className="flex flex-row">
      <FieldSelector addFormField={addFormField} />
    </div>
  )

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
        <h2 className="text-3xl font-bold mb-6">Form Preview</h2>
        <Card className="min-h-[600px] border-2 border-dashed border-muted">
          <CardContent className="p-6">
            {formFields.length > 0 ? (
              <div className="overflow-y-auto flex-1">
                {/* <FormFieldList
                  formFields={formFields}
                  setFormFields={setFormFields}
                  updateFormField={updateFormField}
                  openEditDialog={openEditDialog}
                /> */}

                <FormPreview formFields={formFields} />
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
            <FieldSelectorWithSeparator
              addFormField={(variant: string, index: number = 0) =>
                addFormField(variant, index)
              }
            />
            {/* <Button
              className="w-full mt-8"
              variant="secondary"
              //   onClick={handlSubmit}
            >
              Save Changes
            </Button> */}
          </ScrollArea>
        </CardContent>
      </Card>
      <EditFieldDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        field={selectedField}
        onSave={handleSaveField}
      />
    </div>
  )
}
