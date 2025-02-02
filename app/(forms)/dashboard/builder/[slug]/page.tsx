'use client'

import { CopyButton } from '@/components/copy-button'
import { EditFieldForm } from '@/components/edit-field-form'
import { FieldSelector } from '@/components/field-selector'
import { FormPreview } from '@/components/form-preview'
import { useGenerationStore } from '@/components/GenerationStore'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import { defaultFieldConfig } from '@/constants'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { FormFieldType, FormFieldOrGroup, FormType } from '@/types/types'
import { PlusIcon, SaveIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function FormBuilder() {
  const { slug } = useParams()
  const { addForm, updateForm } = useGenerationStore()

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
  const [isElementAddingWindowOpen, setIsElementAddingWindowOpen] =
    useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    // If a valid `formId` is present and it's not 'new-form', fetch the existing form's data
    if (formId && formId !== 'new-form') {
      fetch(`/api/forms/${formId}`)
        .then((response) => response.json())
        .then((formData) => {
          if (formData) {
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
    variant: string,
    index: number
  const handleDragStart = (e: React.DragEvent, variant: string) => {
    e.dataTransfer.setData('elementVariant', variant)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const variant = e.dataTransfer.getData('elementVariant')

    addFormField(variant)
  }

  const addFormField = (variant: string) => {
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
      rowIndex: 0, // Index to track field's position
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
    console.log('Form Fields: ', formFields)

    if (!formName) {
      toast.error('Form name is required')
      return
    }

    if (formId == null || formId === 'new-form') {
      // Create a new form
      const response = await fetch('/api/forms/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formName: formName,
          formDescription: formDescription,
          formFields: formFields,
        }),
      })
      const body = (await response.json()) as FormType
      const newFormId = body.id

      setFormId(newFormId)
      addForm({
        id: newFormId,
        title: body.title,
        description: body.description,
        fields: JSON.parse(JSON.stringify(formFields)),
        createdAt: body.createdAt,
      })

      // Update the URL without refreshing the page
      const newUrl = `/dashboard/builder/${newFormId}`
      window.history.replaceState(null, '', newUrl)

      toast.success('New Form created successfully!')
    } else {
      // Update the existing form
      const response = await fetch(`/api/forms/${formId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formName,
          description: formDescription,
          fields: formFields,
        }),
      })
      const updatedForm = (await response.json()) as FormType

      updateForm(formId, updatedForm)
      toast.success('Form updated successfully!')
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="hidden md:block w-80 border-0 border-r-2 rounded-none h-screen overflow-hidden">
        <CardContent className="p-4 pt-6 space-y-4">
          <div className="flex flex-row justify-between mb-8">
            <h2 className="text-2xl font-bold">Settings</h2>

            <Button size="sm" variant="secondary" onClick={handleSaveForm}>
              <SaveIcon /> Save
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
          {/* <div className="grid w-full items-center gap-1.5">
            <Label>Form Link</Label>
            <Input
              value={`https://${
                process.env.VERCEL_URL ??
                process.env.NEXT_PUBLIC_VERCEL_URL ??
                'localhost:3000'
              }/forms/${formId ?? 'new-form'}`}
              readOnly
            />
          </div> */}
        </CardContent>
      </Card>

      <div
        className="flex-1 p-4 pt-6 md:p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-row justify-between">
          <h2 className="text-3xl font-bold mb-6">Form Preview</h2>

          <div className="flex flex-row gap-x-2">
            {formId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${formId}`} />
            )}
            {/* <Select
              onValueChange={(e) =>
                setWhichTabIsOpen(e as 'editing' | 'preview')
              }
              defaultValue={whichTabIsOpen}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Editing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preview">Preview</SelectItem>
                <SelectItem value="editing">Editing</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>
        <Card className="min-h-[600px] border-2 border-dashed !p-0 border-muted">
          <CardContent className="p-3 md:p-6">
            {formFields.length > 0 ? (
              <div>
                <FormPreview
                  formFields={formFields}
                  onClickEdit={openEditingWindow}
                  onClickRemove={removeFormField}
                  onReorder={handleReorder}
                  selectedField={isEditingWindowOpen ? selectedField : null}
                  behaveAsPreview={false}
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

      {!isDesktop && (
        <Drawer
          open={isElementAddingWindowOpen}
          onOpenChange={(isOpen) => setIsElementAddingWindowOpen(isOpen)}
        >
          <DrawerTrigger asChild>
            <div
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                }),
                'size-14 justify-center px-0 rounded-full border fixed z-100 bottom-8 right-8 cursor-pointer bg-black'
              )}
            >
              <PlusIcon className="!size-8" />
              <span className="sr-only">Add Field</span>
            </div>
          </DrawerTrigger>
          <DrawerContent className="p-4 pt-0">
            <div className="pt-6">
              <h2 className="text-2xl font-bold">Available Fields</h2>
              <CardDescription>
                Select fields from the list to add to your form
              </CardDescription>
              <Separator className="my-4" />
              <div className="flex flex-row">
                <FieldSelector
                  addFormField={(variant: string) => {
                    setIsElementAddingWindowOpen(false)
                    addFormField(variant)
                  }}
                  onDragStart={(e, variant: string) => {
                    handleDragStart(e, variant)
                    setIsElementAddingWindowOpen(false)
                  }}
                />
              </div>
              {/* <DrawerHeader>
              <DrawerTitle>Are you absolutely sure?</DrawerTitle>
              <DrawerDescription>This action cannot be undone.</DrawerDescription>
            </DrawerHeader> */}
              <div className="flex flex-row pt-4 space-x-2">
                <Button className="w-full" variant="outline">
                  Settings
                </Button>
                {/* <Button className="w-full" variant="outline">
                Cancel
              </Button> */}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Right Side bar */}
      <Card className="hidden md:block w-80 border-0 border-l-2 rounded-none h-screen overflow-hidden">
        <CardContent className="p-4 pt-6">
          <h2 className="text-2xl font-bold">Available Fields</h2>
          <CardDescription>
            Select fields from the list to add to your form
          </CardDescription>
          <Separator className="my-4" />
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="flex flex-row">
              <FieldSelector
                addFormField={(variant: string) => addFormField(variant)}
                onDragStart={(e, variant: string) =>
                  handleDragStart(e, variant)
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
