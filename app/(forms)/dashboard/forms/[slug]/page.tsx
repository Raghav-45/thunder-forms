'use client'

import { EditFieldForm } from '@/components/edit-field-form'
import { FieldSelector } from '@/components/field-selector'
import { FormPreview } from '@/components/form-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
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
import { createForm, getFormById, updateFormbyId } from '@/lib/dbUtils'
import { FormFieldType, FormFieldOrGroup } from '@/types/types'
import { SaveIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function FormBuilder() {
  const { slug } = useParams()

  // BASIC FORM DETAILS
  const [formId, setFormId] = useState<string | null>(
    typeof slug == 'string' ? slug : null
  )
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  // BASIC FORM DETAILS

  const [formFields, setFormFields] = useState<FormFieldOrGroup[]>([])
  const [selectedField, setSelectedField] = useState<FormFieldType | null>(null)
  const [isEditingWindowOpen, setIsEditingWindowOpen] = useState(false)

  const [whichTabIsOpen, setWhichTabIsOpen] = useState<'editing' | 'preview'>(
    'editing'
  )

  useEffect(() => {
    // If a valid `formId` is present and it's not 'new-form', fetch the existing form's data
    if (formId && formId !== 'new-form') {
      getFormById(formId)
        .then((formData) => {
          if (formData?.fields) {
            setFormFields(formData.fields)
            setFormName(formData.title || 'New form')
            setFormDescription(
              formData.description || 'Lorem ipsum dolor sit amet'
            )
          } else {
            toast.error('Failed to load form data')
          }
        })
        .catch((error) => {
          console.error('Error fetching form data:', error)
          toast.error('Error loading form data')
        })
    } else {
      // Reset the form state for a new form
      setFormFields([]) // Clear the form fields
      setFormName('New form') // Reset the form name to 'New form'
      setFormDescription('Lorem ipsum dolor sit amet') // Reset the form description to placeholder text
    }
  }, [formId]) // Only depends on formId

  const handleDragStart = (
    e: React.DragEvent,
    variant: string,
    index: number
  ) => {
    e.dataTransfer.setData('elementVariant', variant)
    e.dataTransfer.setData('elementIndex', index.toString())
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const variant = e.dataTransfer.getData('elementVariant')
    const index = parseInt(e.dataTransfer.getData('elementIndex'), 10)

    addFormField(variant, index)
  }

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
      order: formFields.length,
    }
    // Appending the new field to the existing formFields
    setFormFields([...formFields, newField])
  }

  const handleReorder = (reorderedElements: FormFieldOrGroup[]) => {
    setFormFields(
      reorderedElements.map((element, index) => ({
        ...element,
        order: index,
      }))
    )
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

  const openEditingWindow = (field: FormFieldType) => {
    setSelectedField(field)
    setIsEditingWindowOpen(true)
  }

  const handleSaveField = (updatedField: FormFieldType) => {
    if (selectedField) {
      const path = findFieldPath(formFields, selectedField.name)
      if (path) {
        updateFormField(path, updatedField)
      }
    }
  }

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

  const handleSaveForm = async () => {
    console.log(formFields)

    if (!formName) {
      toast.error('Form name is required')
      return
    }

    if (formId == null || formId === 'new-form') {
      // Create a new form
      const newFormId = await createForm(formName, formDescription, formFields)
      setFormId(newFormId)

      // Update the URL without refreshing the page
      const newUrl = `/dashboard/forms/${newFormId}`
      window.history.replaceState(null, '', newUrl)

      toast.success('New Form created successfully!')
    } else {
      // Update the existing form
      await updateFormbyId(formId, formName, formDescription, formFields)
      toast.success('Form updated successfully!')
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="w-80 border-0 border-r-2 rounded-none h-screen overflow-hidden">
        <CardContent className="p-4 pt-6 space-y-4">
          <div className="flex flex-row justify-between mb-8">
            <h2 className="text-2xl font-bold">Form Settings</h2>
            <Button size="sm" variant="secondary" onClick={handleSaveForm}>
              <SaveIcon /> Save Form
            </Button>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formName">Form Title</Label>
            <Input
              id="formName"
              placeholder="Enter form name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formDescription">Form Description</Label>
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
              value={`https://${
                process.env.VERCEL_URL ??
                process.env.NEXT_PUBLIC_VERCEL_URL ??
                'localhost:3000'
              }/forms/${formId ?? 'new-form'}`}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="flex-1 p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
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
              <div>
                <FormPreview
                  formFields={formFields}
                  onClickEdit={openEditingWindow}
                  onClickRemove={removeFormField}
                  onReorder={handleReorder}
                  selectedField={isEditingWindowOpen ? selectedField : null}
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
      <Card className="w-80 border-0 border-l-2 rounded-none h-screen overflow-hidden">
        <CardContent className="p-4 pt-6">
          <h2 className="text-2xl font-bold">Available Fields</h2>
          <CardDescription>
            Select fields from the list to add to your form
          </CardDescription>
          <Separator className="my-4" />
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="flex flex-row">
              <FieldSelector
                addFormField={(variant: string, index: number = 0) =>
                  addFormField(variant, index)
                }
                onDragStart={(e, variant: string, index: number = 0) =>
                  handleDragStart(e, variant, index)
                }
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <EditFieldForm
        isOpen={isEditingWindowOpen}
        onClose={() => setIsEditingWindowOpen(false)}
        field={selectedField}
        onEditingField={(editedField) => {
          handleSaveField(editedField!)
        }}
      />
    </div>
  )
}
