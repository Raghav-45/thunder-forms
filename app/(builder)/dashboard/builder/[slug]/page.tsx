'use client'

import { CopyButton } from '@/components/copy-button'
import {
  DatePickerWithPresets,
  IMMORTAL_SENTINEL_DATE,
} from '@/components/date-picker-with-presets'
import GenerateWithAiPrompt from '@/components/FormBuilder/core/generate-with-ai'
import { FieldConfig } from '@/components/FormBuilder/elements'
import { useFormStore } from '@/components/FormBuilder/store'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
  getFieldEditor,
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
import ImportGoogleForm from '@/components/FormBuilder/core/import-google-form'

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface IFormStructure {
  pages: {
    sections: {
      fields: FieldConfig[]
    }[]
  }[]
}

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { formSettings, setFormSettings } = useFormStore()
  const { slug: paramFormId } = use(params)
  const [currentFormId, setCurrentFormId] = useState<string>(paramFormId)
  const [formStructure, setFormStructure] = useState<IFormStructure>({
    pages: [
      {
        sections: [
          {
            fields: [],
          },
        ],
      },
    ],
  })
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const currentFields =
    formStructure.pages[currentPageIndex]?.sections[currentSectionIndex]
      ?.fields ?? []
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<FieldConfig | null>(null)
  const [activeFieldSection, setActiveFieldSection] = useState<number | null>(null)

  const updateCurrentFields = (
    updater: (fields: FieldConfig[]) => FieldConfig[],
  ) => {
    setFormStructure((prev) => {
      if (!prev) return prev

      return {
        ...prev,

        pages: prev.pages.map((page, pageIndex) => {
          if (pageIndex !== currentPageIndex) {
            return page
          }

          return {
            ...page,

            sections: page.sections.map((section, sectionIndex) => {
              if (sectionIndex !== currentSectionIndex) {
                return section
              }

              return {
                ...section,
                fields: updater(section.fields),
              }
            }),
          }
        }),
      }
    })
  }

  const moveFieldBetweenSections = (
    sourceSectionIndex: number,
    targetSectionIndex: number,
    fieldId: string,
    targetIndex: number,
  ) => {
    setFormStructure((prev) => {
      if (!prev) return prev

      const currentPage = prev.pages[currentPageIndex]
      if (!currentPage) return prev

      const sourceSection = currentPage.sections[sourceSectionIndex]
      const targetSection = currentPage.sections[targetSectionIndex]
      if (!sourceSection || !targetSection) return prev

      const fieldToMove = sourceSection.fields.find((f) => f.id === fieldId)
      if (!fieldToMove) return prev

      const newSourceFields = sourceSection.fields.filter((f) => f.id !== fieldId)
      const newTargetFields = [...targetSection.fields]
      newTargetFields.splice(targetIndex, 0, fieldToMove)

      return {
        ...prev,
        pages: prev.pages.map((page, pageIndex) => {
          if (pageIndex !== currentPageIndex) {
            return page
          }

          return {
            ...page,
            sections: page.sections.map((section, sectionIndex) => {
              if (sectionIndex === sourceSectionIndex) {
                return { ...section, fields: newSourceFields }
              }
              if (sectionIndex === targetSectionIndex) {
                return { ...section, fields: newTargetFields }
              }
              return section
            }),
          }
        }),
      }
    })
  }

  const [draggedElement, setDraggedElement] =
    useState<avaliableFieldsType | null>(null)
  const [isDraggingSection, setIsDraggingSection] = useState(false)

  const handleSectionDragStart = () => {
    setIsDraggingSection(true)
  }

  const handleSectionDragEnd = () => {
    setIsDraggingSection(false)
  }

  const addSection = () => {
    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pageIndex) => {
        if (pageIndex !== currentPageIndex) {
          return page
        }

        return {
          ...page,
          sections: [
            ...page.sections,
            {
              fields: [],
            },
          ],
        }
      }),
    }))
  }

  const SortableSection = ({
    section,
    sectionIndex,
  }: {
    section: { fields: FieldConfig[] }
    sectionIndex: number
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `section-${sectionIndex}`,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="mb-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleElementDrop(e, sectionIndex)}
      >
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div
            {...attributes}
            {...listeners}
            className="mb-3 flex cursor-grab items-center gap-2 text-xs font-medium text-muted-foreground active:cursor-grabbing"
          >
            <GripVerticalIcon className="size-4" />

            <span>Section {sectionIndex + 1}</span>
          </div>

          {/* Fields */}
          {section.fields.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={section.fields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {section.fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    sectionIndex={sectionIndex}
                    isDragging={isDragging}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="opacity-50">
                    {section.fields.find((field) => field.id === activeId) && (
                      <SortableFieldItem
                        field={
                          section.fields.find((field) => field.id === activeId)!
                        }
                        sectionIndex={sectionIndex}
                      />
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Drag fields here
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleElementDragStart = (draggedElement: avaliableFieldsType) => {
    setDraggedElement(draggedElement)
  }

  const handleElementDrop = (e: React.DragEvent, sectionIndex: number) => {
    e.preventDefault()

    const isSection = e.dataTransfer.getData('application/x-form-section')

    if (isSection === 'section') {
      addSection()
      return
    }

    if (draggedElement) {
      const newField = createDefaultFieldConfig(draggedElement)

      setFormStructure((prev) => ({
        ...prev,
        pages: prev.pages.map((page, pageIndex) => {
          if (pageIndex !== currentPageIndex) {
            return page
          }

          return {
            ...page,
            sections: page.sections.map((section, index) => {
              if (index !== sectionIndex) {
                return section
              }

              return {
                ...section,
                fields: [...section.fields, newField],
              }
            }),
          }
        }),
      }))

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
    const id = event.active.id as string
    setActiveId(id)

    const currentPage = formStructure.pages[currentPageIndex]
    if (!currentPage) return

    for (const section of currentPage.sections) {
      const field = section.fields.find((f) => f.id === id)
      if (field) {
        setActiveField(field)
        break
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeIdStr = active.id as string
      const overIdStr = over.id as string

      const currentPage = formStructure.pages[currentPageIndex]
      if (!currentPage) {
        setActiveId(null)
        setActiveField(null)
        return
      }

      let sourceSectionIndex = -1
      let targetSectionIndex = -1
      let activeFieldData: FieldConfig | null = null

      for (let i = 0; i < currentPage.sections.length; i++) {
        const section = currentPage.sections[i]
        const activeField = section.fields.find((f) => f.id === activeIdStr)
        if (activeField) {
          sourceSectionIndex = i
          activeFieldData = activeField
        }
        const overField = section.fields.find((f) => f.id === overIdStr)
        if (overField) {
          targetSectionIndex = i
        }
      }

      if (sourceSectionIndex === -1 || targetSectionIndex === -1 || !activeFieldData) {
        setActiveId(null)
        setActiveField(null)
        return
      }

      if (sourceSectionIndex === targetSectionIndex) {
        setFormStructure((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            pages: prev.pages.map((page, pageIndex) => {
              if (pageIndex !== currentPageIndex) {
                return page
              }

              return {
                ...page,
                sections: page.sections.map((section, sectionIndex) => {
                  if (sectionIndex !== sourceSectionIndex) {
                    return section
                  }

                  const oldIndex = section.fields.findIndex(
                    (item) => item.id === activeIdStr,
                  )
                  const newIndex = section.fields.findIndex(
                    (item) => item.id === overIdStr,
                  )

                  return {
                    ...section,
                    fields: arrayMove(section.fields, oldIndex, newIndex),
                  }
                }),
              }
            }),
          }
        })
      } else {
        setFormStructure((prev) => {
          if (!prev) return prev

          const page = prev.pages[currentPageIndex]
          if (!page) return prev

          const sourceSection = page.sections[sourceSectionIndex]
          const targetSection = page.sections[targetSectionIndex]
          if (!sourceSection || !targetSection) return prev

          const newSourceFields = sourceSection.fields.filter(
            (f) => f.id !== activeIdStr,
          )
          const targetIndex = targetSection.fields.findIndex(
            (f) => f.id === overIdStr,
          )
          const newTargetFields = [...targetSection.fields]
          newTargetFields.splice(targetIndex, 0, activeFieldData!)

          return {
            ...prev,
            pages: prev.pages.map((page, pageIndex) => {
              if (pageIndex !== currentPageIndex) {
                return page
              }

              return {
                ...page,
                sections: page.sections.map((section, sectionIndex) => {
                  if (sectionIndex === sourceSectionIndex) {
                    return { ...section, fields: newSourceFields }
                  }
                  if (sectionIndex === targetSectionIndex) {
                    return { ...section, fields: newTargetFields }
                  }
                  return section
                }),
              }
            }),
          }
        })
      }
    }

    setActiveId(null)
    setActiveField(null)
  }

  const handleRemoveField = (id: string) => {
    updateCurrentFields((prev) => prev.filter((field) => field.id !== id))
  }

  const SortableFieldItem = ({
    field,
    sectionIndex,
  }: {
    field: FieldConfig
    sectionIndex: number
  }) => {
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
    if (!editingField) return null

    const EditorComponent = getFieldEditor(
      editingField.uniqueIdentifier,
    ) as React.FC<{
      field: FieldConfig
      onUpdate: (field: FieldConfig) => void
      onClose: () => void
      isOpen: boolean
    }>

    return (
      <EditorComponent
        field={editingField}
        onUpdate={(updatedField) => {
          updateCurrentFields((prev) =>
            prev.map((f) =>
              f.id === updatedField.id ? { ...f, ...updatedField } : f,
            ),
          )
          setEditingField(null)
        }}
        onClose={() => setEditingField(null)}
        isOpen={true}
      />
    )
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
          submitButtonText: form.data.submitButtonText,
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
          const issues = error.response.data?.issues as
            | { field: string; message: string }[]
            | undefined
          toast.error('Validation error', {
            description: issues?.length
              ? issues
                  .map((issue) => `• ${issue.field}: ${issue.message}`)
                  .join('\n')
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
        submitButtonText: updateData.submitButtonText,
      })
      return data
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          const issues = error.response.data?.issues as
            | { field: string; message: string }[]
            | undefined
          toast.error('Validation error', {
            description: issues?.length
              ? issues
                  .map((issue) => `• ${issue.field}: ${issue.message}`)
                  .join('\n')
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
      fields: formStructure || [],
      maxSubmissions: formSettings.maxSubmissions
        ? isNaN(formSettings.maxSubmissions)
          ? null
          : formSettings.maxSubmissions
        : null,
      expiresAt: formSettings.expiresAt,
      redirectUrl: formSettings.redirectUrl?.trim() || null,
      submitButtonText: formSettings.submitButtonText?.trim() || null,
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
          <SettingsDialog />

          <div className="flex-grow"></div>

          <ImportGoogleForm
            onImported={(title, description, fields) => {
              setFormSettings({
                ...formSettings,
                title,
                description,
              })
              setFields(fields)
            }}
          />

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
        {/* Page Tabs */}
        <div className="flex items-center gap-1 mb-3 border-b">
          {formStructure.pages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentPageIndex(index)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                currentPageIndex === index
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              Page {index + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setFormStructure((prev) => ({
                ...prev,
                pages: [
                  ...prev.pages,
                  {
                    sections: [
                      {
                        fields: [],
                      },
                    ],
                  },
                ],
              }))

              setCurrentPageIndex(formStructure.pages.length)
            }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            + Add Page
          </button>
        </div>
        <Card
          className={cn(
            'h-[calc(100vh-100px)] overflow-y-scroll border-2 border-dashed !p-0 border-muted mb-1',
            !(
              (
                formStructure.pages[currentPageIndex]?.sections
                  .map((s) => s.fields)
                  .flat() ?? []
              ).length > 0
            ) && 'flex items-center justify-center',
          )}
        >
          <CardContent className="p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event

                if (!over || active.id === over.id) {
                  return
                }

                const oldIndex = Number(
                  String(active.id).replace('section-', ''),
                )

                const newIndex = Number(String(over.id).replace('section-', ''))

                if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) {
                  return
                }

                setFormStructure((prev) => ({
                  ...prev,
                  pages: prev.pages.map((page, pageIndex) => {
                    if (pageIndex !== currentPageIndex) {
                      return page
                    }

                    return {
                      ...page,
                      sections: arrayMove(page.sections, oldIndex, newIndex),
                    }
                  }),
                }))

                setCurrentSectionIndex(newIndex)
              }}
            >
              <SortableContext
                items={(
                  formStructure.pages[currentPageIndex]?.sections ?? []
                ).map((_, index) => `section-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {formStructure.pages[currentPageIndex]?.sections.map(
                  (section, sectionIndex) => (
                    <SortableSection
                      key={`section-${sectionIndex}`}
                      section={section}
                      sectionIndex={sectionIndex}
                    />
                  ),
                )}
              </SortableContext>
            </DndContext>
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
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Layout
                    </p>

                    <Button
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/x-form-section',
                          'section',
                        )
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      variant="outline"
                      className="w-full rounded-lg bg-neutral-900! cursor-grab"
                      size="sm"
                    >
                      <GripVerticalIcon className="size-4" />

                      <span className="flex-1 text-left">Section</span>
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Fields
                  </p>
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
