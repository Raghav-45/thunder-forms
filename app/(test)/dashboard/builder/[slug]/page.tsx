'use client'

import { CopyButton } from '@/components/copy-button'
import {
  DatePickerWithPresets,
  IMMORTAL_SENTINEL_DATE,
} from '@/components/date-picker-with-presets'
import GenerateWithAiPrompt from '@/components/FormBuilder/core/generate-with-ai'
import {
  FieldConfig,
  DatePickerEditor,
  MultiSelectEditor,
  SwitchEditor,
  TextAreaEditor,
  TextInputEditor,
  SectionHeaderEditor,
  CheckboxEditor,
  NumberInputEditor,
  SingleSelectEditor,
  RadioGroupEditor,
  SliderEditor,
  DateTimePickerEditor,
  TextInputConfig,
  MultiSelectConfig,
  TextAreaConfig,
  SwitchConfig,
  DatePickerConfig,
  SectionHeaderConfig,
  CheckboxConfig,
  NumberInputConfig,
  SingleSelectConfig,
  RadioGroupConfig,
  SliderConfig,
  DateTimePickerConfig,
} from '@/components/FormBuilder/elements'
import { useFormStore } from '@/components/FormBuilder/store'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { CreateFormPayload } from '@/lib/validators/form'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SettingsDialog } from '@/components/settings-dialog'

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { formSettings, setFormSettings } = useFormStore()
  const { slug: paramFormId } = use(params)
  const [currentFormId, setCurrentFormId] = useState<string>(paramFormId)
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const [draggedElement, setDraggedElement] =
    useState<avaliableFieldsType | null>(null)

  const handleElementDragStart = (draggedElement: avaliableFieldsType) => {
    setDraggedElement(draggedElement)
  }

  const handleElementDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedElement) {
      const newField = createDefaultFieldConfig(draggedElement)
      setFields((prev) => [...prev, newField])
      setDraggedElement(null)
    }
  }

  useEffect(() => {
    setCurrentFormId(paramFormId)
  }, [paramFormId])

  const isExistingForm = currentFormId && currentFormId !== 'new-form'
  const isNewForm = !isExistingForm && currentFormId === 'new-form'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveId(null)
  }

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id))
  }

  const SortableFieldItem = ({ field }: { field: FieldConfig }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    return (
      <div ref={setNodeRef} style={style} className="mb-4 group">
        <div
          {...attributes}
          {...listeners}
          className="relative flex items-start gap-2 bg-card rounded-lg border-2 border-dashed border-border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing"
        >
          {/* Drag Handle - Visual indicator only */}
          {/* <div className="pt-2 opacity-0 group-hover:opacity-70 pointer-events-none transition-opacity flex-shrink-0">
            <GripVerticalIcon className="size-5 text-muted-foreground" />
          </div> */}

          {/* Field Content */}
          <div className="flex-1 pr-2 pointer-events-none">
            <FieldComponent
              field={field as never}
              value={undefined}
              onChange={(value) => console.log(field.id, value)}
            />
          </div>

          {/* Action Buttons - Only visible on hover */}
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="cursor-pointer h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary border border-border/50"
                onClick={() => setEditingField(field)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="cursor-pointer h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive border border-border/50"
                onClick={() => handleRemoveField(field.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderEditor = () => {
    const field = editingField
    if (!field) return null

    const handleUpdateField = (updatedField: FieldConfig) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === updatedField.id ? { ...field, ...updatedField } : field,
        ),
      )
      setEditingField(null)
    }

    const baseProps = {
      field,
      onUpdate: handleUpdateField,
      onClose: () => {
        setEditingField(null)
      },
      isOpen: true,
    }

    switch (field.uniqueIdentifier) {
      case 'text-input':
        return (
          <TextInputEditor
            {...baseProps}
            field={field as TextInputConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'multi-select':
        return (
          <MultiSelectEditor
            {...baseProps}
            field={field as MultiSelectConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'text-area':
        return (
          <TextAreaEditor
            {...baseProps}
            field={field as TextAreaConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'switch-field':
        return (
          <SwitchEditor
            {...baseProps}
            field={field as SwitchConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'date-picker':
        return (
          <DatePickerEditor
            {...baseProps}
            field={field as DatePickerConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'section-header':
        return (
          <SectionHeaderEditor
            {...baseProps}
            field={field as SectionHeaderConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'checkbox':
        return (
          <CheckboxEditor
            {...baseProps}
            field={field as CheckboxConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'number-input':
        return (
          <NumberInputEditor
            {...baseProps}
            field={field as NumberInputConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'single-select':
        return (
          <SingleSelectEditor
            {...baseProps}
            field={field as SingleSelectConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'radio-group':
        return (
          <RadioGroupEditor
            {...baseProps}
            field={field as RadioGroupConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'slider':
        return (
          <SliderEditor
            {...baseProps}
            field={field as SliderConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      case 'datetime-picker':
        return (
          <DateTimePickerEditor
            {...baseProps}
            field={field as DateTimePickerConfig}
            onUpdate={(f) => handleUpdateField(f)}
          />
        )
      default:
        return null
    }
  }

  const form = useQuery({
    queryKey: ['form', currentFormId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/forms/${currentFormId}`)
      return data
    },
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!isExistingForm,
  })

  useEffect(() => {
    if (isExistingForm) {
      if (form.isError) {
        toast.error('Failed to load Form')
        return
      }
      if (form.isSuccess && form.data) {
        setFormSettings({
          ...formSettings,
          title: form.data.title,
          description: form.data.description,
          expiresAt: form.data.expiresAt
            ? new Date(form.data.expiresAt)
            : IMMORTAL_SENTINEL_DATE,
          maxSubmissions: form.data.maxSubmissions,
          redirectUrl: form.data.redirectUrl,
        })
        setFields(form.data.fields)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExistingForm, currentFormId, form.isSuccess, form.isError, form.data])

  const createFormMutation = useMutation({
    mutationFn: async (payload: CreateFormPayload) => {
      const { data } = await axios.post('/api/forms/new', payload)
      return data
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          const issues = error.response.data?.issues as { field: string; message: string }[] | undefined
          toast.error('Validation error', {
            description: issues?.length
              ? issues.map((issue) => `• ${issue.field}: ${issue.message}`).join('\n')
              : 'Please check your form fields and try again.',
            style: { whiteSpace: 'pre-line' },
          })
          return
        }
        toast.error('Failed to create form')
      }
    },
    onSuccess: (data) => {
      setCurrentFormId(data.id)
      const newUrl = `/dashboard/builder/${data.id}`
      window.history.replaceState(null, '', newUrl)
      toast.success('New Form created successfully!')
    },
  })

  const updateFormMutation = useMutation({
    mutationFn: async (payload: CreateFormPayload & { formId: string }) => {
      const { formId, ...updateData } = payload
      console.log('Updating form with data:', payload)

      const { data } = await axios.post(`/api/forms/${formId}/update`, {
        title: updateData.title,
        description: updateData.description,
        fields: updateData.fields,
        maxSubmissions: updateData.maxSubmissions,
        expiresAt: updateData.expiresAt,
        redirectUrl: updateData.redirectUrl,
      })
      return data
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          const issues = error.response.data?.issues as { field: string; message: string }[] | undefined
          toast.error('Validation error', {
            description: issues?.length
              ? issues.map((issue) => `• ${issue.field}: ${issue.message}`).join('\n')
              : 'Please check your form fields and try again.',
            style: { whiteSpace: 'pre-line' },
          })
          return
        }
        toast.error('Failed to update form')
      }
    },
    onSuccess: () => {
      toast.success('Form updated successfully!')
    },
  })

  const handleSaveForm = () => {
    if (!formSettings.title.trim()) {
      toast.error('Form name is required')
      return
    }

    const payload: CreateFormPayload = {
      title: formSettings.title,
      description: formSettings.description?.trim() || null,
      fields: fields,
      maxSubmissions: formSettings.maxSubmissions
        ? isNaN(formSettings.maxSubmissions)
          ? null
          : formSettings.maxSubmissions
        : null,
      expiresAt: formSettings.expiresAt,
      redirectUrl: formSettings.redirectUrl?.trim() || null,
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

  const isSaving = createFormMutation.isPending || updateFormMutation.isPending

  return (
    <div className="flex bg-background h-screen text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="hidden md:block border-0 border-r-2 rounded-none w-80 h-screen overflow-hidden">
        <CardContent className="flex flex-col space-y-4 p-4 py-0 h-full">
          <div className="flex flex-row justify-between mb-8">
            <h2 className="font-bold text-2xl">Settings</h2>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveForm}
              disabled={isSaving}
              className="text-xs cursor-pointer"
            >
              {isSaving ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}{' '}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="title">Form Title</Label>
            <Input
              id="title"
              placeholder="Enter form name"
              value={formSettings.title}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  title: e.target.value,
                })
              }
              className="bg-neutral-900!"
            />
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="description">Form Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              className="max-h-24 bg-neutral-900!"
              value={formSettings.description}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  description: e.target.value,
                })
              }
            />
          </div>



          <div className="flex-grow"></div>


          <SettingsDialog />

          <GenerateWithAiPrompt
            onGeneratedFields={(title, description, fields) => {
              setFormSettings({
                ...formSettings,
                title,
                description,
              })
              setFields(fields)
            }}
          />
        </CardContent>
      </Card>

      <ScrollArea className="flex-1 p-4 md:p-4 pt-6 overflow-auto sticky">
        <div className="flex flex-row justify-between">
          <h2 className="mb-6 font-bold text-3xl">Builder</h2>

          <div className="flex flex-row gap-x-2">
            {currentFormId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
            )}
          </div>
        </div>
        <Card
          className={cn(
            'h-[calc(100vh-100px)] overflow-y-scroll border-2 border-dashed !p-0 border-muted mb-1',
            !(fields.length > 0) && 'flex items-center justify-center',
          )}
          onDragOver={(e: React.DragEvent) => e.preventDefault()}
          onDrop={handleElementDrop}
        >
          <CardContent
            className={cn(
              'p-3 md:p-4',
              !(fields.length > 0) &&
                'flex items-center justify-center w-full h-full',
            )}
          >
            {fields.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field) => (
                    <SortableFieldItem key={field.id} field={field} />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-50">
                      {fields.find((f) => f.id === activeId) && (
                        <SortableFieldItem
                          field={fields.find((f) => f.id === activeId)!}
                        />
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground text-center">
                <p>Drag elements here to build your form or Generate with AI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollArea>

      <>
        <Card className="hidden md:block border-0 border-l-2 rounded-none w-80 h-screen overflow-hidden">
          <CardContent className="p-4 pt-0">
            <h2 className="font-bold text-2xl">Available Fields</h2>
            <CardDescription>
              Select fields from the list to add
            </CardDescription>
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="flex flex-row">
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
                  {AVAILABLE_FIELDS.concat(comingSoonElements).map(
                    (fieldType) => (
                      <Button
                        key={fieldType}
                        draggable={AVAILABLE_FIELDS.includes(fieldType)}
                        onDragStart={() =>
                          handleElementDragStart(
                            fieldType as avaliableFieldsType,
                          )
                        }
                        variant="outline"
                        className="rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab"
                        size="sm"
                        disabled={!AVAILABLE_FIELDS.includes(fieldType)}
                      >
                        <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                          {fieldType}
                        </div>
                        {!AVAILABLE_FIELDS.includes(fieldType) && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold mx-1 px-1 bg-blue-400 text-black rounded-full py-0"
                          >
                            coming soon
                          </Badge>
                        )}
                        <div className="ml-auto flex flex-row">
                          <GripVerticalIcon className="size-4" />
                        </div>
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {renderEditor()}
      </>
    </div>
  )
}

const comingSoonElements = [
  'Combobox',
  'File Input',
  'Input OTP',
  'Location Input',
  'Password',
  'Phone',
  'Signature Input',
  'Smart Datetime Input',
  'Tags Input',
]
