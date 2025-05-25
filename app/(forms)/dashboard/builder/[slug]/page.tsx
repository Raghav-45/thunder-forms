'use client'

import { CopyButton } from '@/components/copy-button'
import { EditFieldForm } from '@/components/FormBuilder/edit-field-form'
import { FieldSelector } from '@/components/FormBuilder/field-selector'
import { FormPreview } from '@/components/FormBuilder/form-preview'
import GenerateWithAiPrompt from '@/components/FormBuilder/generate-with-ai'
// import { useGenerationStore } from '@/components/GenerationStore'
import { siteConfig } from '@/config/site'
import { getDefaultFieldConfig } from '@/constants'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { FormType, TemplateType } from '@/types/types'
import { Loader2Icon, PlusIcon, SaveIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { DatePickerWithPresets } from '@/components/date-picker-with-presets'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CreateFormPayload, FormFieldPayload } from '@/lib/validators/form'
import axios from 'axios'

const DEFAULT_FORM_NAME = 'New form'
const DEFAULT_FORM_DESCRIPTION = 'Lorem ipsum dolor sit amet'

interface FormBuilderProps {
  params: { slug: string }
}

export default function FormBuilder({ params }: FormBuilderProps) {
  // const { slug } = useParams()
  const searchParams = useSearchParams()
  // const { addForm, updateForm } = useGenerationStore()

  // BASIC FORM DETAILS
  // const [formId, setFormId] = useState<string | null>(
  //   typeof slug == 'string' ? slug : null
  // )
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  // BASIC FORM DETAILS

  // const [isFormSaving, setIsFormSaving] = useState(false)

  const [formFields, setFormFields] = useState<FormFieldPayload[]>([])
  const [selectedField, setSelectedField] = useState<FormFieldPayload | null>(
    null
  )
  const [isEditingWindowOpen, setIsEditingWindowOpen] = useState(false)
  const [isElementAddingWindowOpen, setIsElementAddingWindowOpen] =
    useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // BASIC FORM PROPERTIES CALCULATIONS
  const { slug: currentFormId } = params
  const templateUniqueName = searchParams.get('template')

  const isExistingForm = currentFormId && currentFormId !== 'new-form' // Means Form Id is provided
  const isNewForm = !isExistingForm && currentFormId === 'new-form' // Means we are creating a new form
  const isGoingToUseTemplate = isNewForm && templateUniqueName // Means we are creating a new form with a template

  const [formName, setFormName] = useState<string>(
    isNewForm ? DEFAULT_FORM_NAME : ''
  )
  const [formDescription, setFormDescription] = useState<string>(
    isNewForm ? DEFAULT_FORM_DESCRIPTION : ''
  )

  const template = useQuery({
    queryKey: ['template', templateUniqueName],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/forms/templates/${templateUniqueName}`
      )
      return data as TemplateType
    },
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!isGoingToUseTemplate, // Only fetch when condition met
  })
  const form = useQuery({
    queryKey: ['template', currentFormId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/forms/${currentFormId}`)
      return data as FormType
    },
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!isExistingForm, // Only fetch when condition met
  })

  const generateFormWithTemplate = useCallback((template: TemplateType) => {
    const templateFormFields: FormFieldPayload[] = []

    template.fields.map((field) => {
      // Generate a unique field name using a random number
      const newFieldName = `name_${Math.random().toString().slice(-10)}`

      const { checked, rowIndex, disabled, required, value, type } =
        getDefaultFieldConfig(field.variant)

      const newField: FormFieldPayload = {
        checked: checked, // Field is initially checked
        label: field.label || '', // Use label from config or fallback to generated field name
        description: field.description || '', // Use default or fallback to an empty string
        required: required, // Field is required by default
        disabled: disabled, // Field is enabled by default
        name: newFieldName, // Unique field name
        placeholder: field.placeholder || '', // Default placeholder if not provided
        rowIndex: rowIndex, // Index to track field's position
        type: type, // Type of the field (left empty for now)
        value: value, // Default value (empty)
        variant: field.variant, // Field variant (e.g., text, checkbox, etc.)
        order: formFields.length,
        // onChange: () => {}, // Placeholder for the onChange handler
        // onSelect: () => {}, // Placeholder for the onSelect handler
        // setValue: () => {}, // Placeholder for the setValue handler
      }
      // Appending the new field

      templateFormFields.push(newField)
    })
    setFormFields(templateFormFields)
  }, [formFields.length])

  // Use useEffect to set state when template data is successfully loaded
  useEffect(() => {
    if (isGoingToUseTemplate) {
      if (template.isError) {
        toast.error('Failed to load Template')
        return
      }
      if (template.isSuccess && template.data) {
        setFormName(template.data.title)
        setFormDescription(template.data.description)
        generateFormWithTemplate(template.data)
      }
    }  }, [
    isGoingToUseTemplate,
    templateUniqueName,
    template.isSuccess,
    template.isError,
    template.data,
    generateFormWithTemplate,
  ])

  // Use useEffect to set state when form data is successfully loaded
  useEffect(() => {
    if (isExistingForm) {
      if (form.isError) {
        toast.error('Failed to load Form')
        return
      }
      if (form.isSuccess && form.data) {
        setFormName(form.data.title)
        setFormDescription(form.data.description)
        setExpiresAt(form.data.expiresAt ? new Date(form.data.expiresAt) : null)
        setMaxSubmissions(form.data.maxSubmissions)
        setRedirectUrl(form.data.redirectUrl)
        setFormFields(form.data.fields as unknown as FormFieldPayload[])
      }
    }  }, [isExistingForm, currentFormId, form.isSuccess, form.isError, form.data])

  const addFormField = (variant: string) => {
    // Generate a unique field name using a random number
    const newFieldName = `name_${Math.random().toString().slice(-10)}`

    // Retrieve default configuration (label, description, placeholder) for the selected field variant
    const {
      label,
      description,
      placeholder,
      checked,
      rowIndex,
      disabled,
      hour12,
      locale,
      max,
      min,
      required,
      step,
      value,
      type,
      // variant: fieldVariant
    } = getDefaultFieldConfig(variant)

    const newField: FormFieldPayload = {
      checked: checked, // Field is initially checked or not
      label: label, // Use label from config or fallback to generated field name
      description: description, // Use default or fallback to an empty string
      required: required, // Field is required by default
      disabled: disabled, // Field is enabled by default
      name: newFieldName, // Unique field name
      placeholder: placeholder, // Default placeholder if not provided
      rowIndex: rowIndex, // Index to track field's position
      type: type, // Type of the field (left empty for now)
      value: value, // Default value (empty)
      variant, // Field variant (e.g., text, checkbox, etc.)
      order: formFields.length,
      min: min, // Minimum value if applicable
      max: max, // Maximum value if applicable
      step: step, // Step value if applicable
      locale: locale, // Locale for date/time fields
      hour12: hour12, // 12-hour format for time fields
      // onChange: () => {}, // Placeholder for the onChange handler
      // onSelect: () => {}, // Placeholder for the onSelect handler
      // setValue: () => {}, // Placeholder for the setValue handler
    }
    // Appending the new field to the existing formFields
    setFormFields([...formFields, newField])
  }

  const handleDragStart = (e: React.DragEvent, variant: string) => {
    e.dataTransfer.setData('elementVariant', variant)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const variant = e.dataTransfer.getData('elementVariant')
    addFormField(variant)
  }

  const handleDropBetween = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const variant = e.dataTransfer.getData('elementVariant')

    if (variant) {
      // Generate a unique field name using a random number
      const newFieldName = `name_${Math.random().toString().slice(-10)}`

      // Retrieve default configuration for the selected field variant
      const {
        label,
        description,
        placeholder,
        checked,
        rowIndex,
        disabled,
        hour12,
        locale,
        max,
        min,
        required,
        step,
        value,
        type,
      } = getDefaultFieldConfig(variant)

      const newField: FormFieldPayload = {
        checked: checked,
        label: label,
        description: description,
        required: required,
        disabled: disabled,
        name: newFieldName,
        placeholder: placeholder,
        rowIndex: rowIndex,
        type: type,
        value: value,
        variant,
        order: index,
        min: min,
        max: max,
        step: step,
        locale: locale,
        hour12: hour12,
      }

      // Insert the new field at the specified index
      const updatedFields = [...formFields]
      updatedFields.splice(index, 0, newField)

      // Reorder all fields to maintain correct order
      const reorderedFields = updatedFields.map((field, idx) => ({
        ...field,
        order: idx,
      }))

      setFormFields(reorderedFields)
    }
  }

  const handleReorder = (reorderedElements: FormFieldPayload[]) => {
    setFormFields(
      reorderedElements.map((element, index) => ({
        ...element,
        order: index,
      }))
    )
  }

  const findFieldPath = (
    fields: FormFieldPayload[],
    name: string
  ): number[] | null => {
    const search = (
      currentFields: FormFieldPayload[],
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

  const handleSaveField = (updatedField: FormFieldPayload) => {
    if (selectedField) {
      const path = findFieldPath(formFields, selectedField.name)
      if (path) {
        updateFormField(path, updatedField)
      }
    }
  }

  const updateFormField = (
    path: number[],
    updates: Partial<FormFieldPayload>
  ) => {
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

  const removeFormField = (fieldToRemove: FormFieldPayload) => {
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

  const openEditingWindow = (field: FormFieldPayload) => {
    setSelectedField(field)
    setIsEditingWindowOpen(true)
  }

  // Mutation for creating new forms
  const createFormMutation = useMutation({
    mutationFn: async (payload: CreateFormPayload) => {
      const { data } = await axios.post('/api/forms/new', payload)
      return data as FormType
    },
    onError: (error) => {
      console.error('Error creating form:', error)
      toast.error('Failed to create form')
    },
    onSuccess: (data) => {
      console.log('Form created successfully:', data)

      // Add to store
      // addForm({
      //   id: data.id,
      //   title: data.title,
      //   description: data.description,
      //   fields: JSON.parse(JSON.stringify(formFields)),
      //   createdAt: data.createdAt,
      //   maxSubmissions: data.maxSubmissions,
      //   expiresAt: data.expiresAt,
      //   redirectUrl: data.redirectUrl,
      //   _count: { responses: 0 },
      // })

      // Update the URL without refreshing the page
      const newUrl = `/dashboard/builder/${data.id}`
      window.history.replaceState(null, '', newUrl)

      // Invalidate queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['forms'] })

      toast.success('New Form created successfully!')
    },
  })

  // Mutation for updating existing forms
  const updateFormMutation = useMutation({
    mutationFn: async (payload: CreateFormPayload & { formId: string }) => {
      const { formId, ...updateData } = payload
      const { data } = await axios.post(`/api/forms/${formId}/update`, {
        title: updateData.formName,
        description: updateData.formDescription,
        fields: updateData.formFields,
        maxSubmissions: updateData.maxSubmissions,
        expiresAt: updateData.expiresAt,
        redirectUrl: updateData.redirectUrl,
      })
      return data as FormType
    },
    onError: (error) => {
      console.error('Error updating form:', error)
      toast.error('Failed to update form')
    },
    onSuccess: (data) => {
      console.log('Form updated successfully:', data)

      // Update store
      // updateForm(currentFormId!, data)

      // Invalidate queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['form', currentFormId] })
      // queryClient.invalidateQueries({ queryKey: ['forms'] })

      toast.success('Form updated successfully!')
    },
  })

  // Handle save form (create or update)
  const handleSaveForm = () => {
    if (!formName.trim()) {
      toast.error('Form name is required')
      return
    }

    const payload: CreateFormPayload = {
      formName: formName,
      formDescription: formDescription,
      formFields: formFields,
      maxSubmissions: maxSubmissions,
      expiresAt: expiresAt,
      redirectUrl: redirectUrl,
    }

    if (isNewForm) {
      createFormMutation.mutate(payload)
    } else if (isExistingForm) {
      updateFormMutation.mutate({
        ...payload,
        formId: currentFormId,
      })
    }
  }

  // Check if any mutation is loading
  const isSaving = createFormMutation.isPending || updateFormMutation.isPending

  return (
    <div className="flex bg-background h-screen text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="hidden md:block border-0 border-r-2 rounded-none w-80 h-screen overflow-hidden">
        <CardContent className="flex flex-col space-y-4 p-4 pt-6 h-full">
          <div className="flex flex-row justify-between mb-4">
            <h2 className="font-bold text-2xl">Settings</h2>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSaveForm()}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="formName">Form Title</Label>
            <Input
              id="formName"
              placeholder="Enter form name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="formDescription">Form Description</Label>
            <Textarea
              id="formDescription"
              placeholder="Enter description"
              className="max-h-24"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="py-2">
            <Separator />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="expiresAt">Expiration Date</Label>
            <DatePickerWithPresets date={expiresAt} setDate={setExpiresAt} />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="maxSubmission">Max Submission Limit</Label>
            <Input
              id="maxSubmission"
              type="number"
              placeholder="Enter max value (optional)"
              value={maxSubmissions || ''}
              onChange={(e) =>
                setMaxSubmissions(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
            />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="redirectUrl">Redirect URL</Label>
            <Input
              id="redirectUrl"
              type="url"
              placeholder="https://example.com (optional)"
              value={redirectUrl || ''}
              onChange={(e) => setRedirectUrl(e.target.value || null)}
            />
          </div>

          {/* This div will push the content below it to the bottom */}
          <div className="flex-grow"></div>

          {/* This will now be at the bottom */}
          <GenerateWithAiPrompt
            onGeneratedFields={(title, description, fields) => {
              setFormName(title)
              setFormDescription(description)
              setFormFields(fields as unknown as FormFieldPayload[])
            }}
          />
        </CardContent>
      </Card>      <ScrollArea className="flex-1 p-4 md:p-4 pt-6 overflow-auto">
        <div className="flex flex-row justify-between">
          <h2 className="mb-6 font-bold text-3xl">Builder</h2>

          <div className="flex flex-row gap-x-2">
            {currentFormId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
            )}
          </div>
        </div>          <FormPreview
          formFields={formFields}
          onClickEdit={openEditingWindow}
          onClickRemove={removeFormField}
          onReorder={handleReorder}
          selectedField={isEditingWindowOpen ? selectedField : null}
          behaveAsPreview={false}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDropBetween={handleDropBetween}
        />
      </ScrollArea>

      {isDesktop ? (
        // Right Side bar - Desktop Only
        <>
          <Card className="hidden md:block border-0 border-l-2 rounded-none w-80 h-screen overflow-hidden">
            <CardContent className="p-4 pt-6">
              <h2 className="font-bold text-2xl">Available Fields</h2>
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
        </>
      ) : (
        // Drawer - Mobile Only
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
              <h2 className="font-bold text-2xl">Available Fields</h2>
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
              <div className="flex flex-row space-x-2 pt-4">
                <Button className="w-full" variant="outline">
                  Settings
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
