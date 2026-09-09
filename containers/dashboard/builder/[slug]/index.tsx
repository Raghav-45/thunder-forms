'use client'

import { CopyButton } from '@/features/form-builder/components/copy-button'
import { IMMORTAL_SENTINEL_DATE } from '@/features/form-builder/components/date-picker-with-presets'
import GenerateWithAiPrompt from '@/features/form-builder/core/generate-with-ai'
import { FieldConfig } from '@/features/form-builder/elements'
import { useFormStore } from '@/features/form-builder/store'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/features/form-builder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
  getFieldEditor,
} from '@/features/form-builder/utils/helperFunctions'
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
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import {
  CollisionPriority,
  type Droppable,
} from '@dnd-kit/abstract'
import {
  Feedback,
  PointerSensor,
  PointerActivationConstraints,
  type Sensors,
} from '@dnd-kit/dom'
import {
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { Fragment, use, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { SettingsDialog } from '@/features/form-builder/components/settings-dialog'
import ImportGoogleForm from '@/features/form-builder/core/import-google-form'

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface IFormStructure {
  pages: {
    sections: {
      id: string
      fields: FieldConfig[]
    }[]
  }[]
}

const newSection = (): { id: string; fields: FieldConfig[] } => ({
  id: crypto.randomUUID(),
  fields: [],
})

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { formSettings, setFormSettings } = useFormStore()
  const { slug: paramFormId } = use(params)
  const [currentFormId, setCurrentFormId] = useState<string>(paramFormId)
  const [formStructure, setFormStructure] = useState<IFormStructure>({
    pages: [
      {
        sections: [newSection()],
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

  const addSection = () => {
    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pageIndex) => {
        if (pageIndex !== currentPageIndex) {
          return page
        }

        return {
          ...page,
          sections: [...page.sections, newSection()],
        }
      }),
    }))
  }

  const renderSectionCard = (
    section: { id: string; fields: FieldConfig[] },
    sectionIndex: number,
    handleRef?: React.Ref<HTMLDivElement>,
    sortableFields = true,
  ) => (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div
        ref={handleRef}
        className="mb-3 flex cursor-grab items-center gap-2 text-xs font-medium text-muted-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />

        <span>Section {sectionIndex + 1}</span>
      </div>

      {section.fields.length > 0 ? (
        section.fields.map((field, index) =>
          sortableFields ? (
            <SortableFieldItem
              key={field.id}
              field={field}
              index={index}
              sectionIndex={sectionIndex}
              sectionId={section.id}
            />
          ) : (
            <div key={field.id} className="mb-4">
              {renderFieldCard(field)}
            </div>
          ),
        )
      ) : (
        <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Drag fields here
        </div>
      )}
    </div>
  )

  const SortableSection = ({
    section,
    sectionIndex,
  }: {
    section: { id: string; fields: FieldConfig[] }
    sectionIndex: number
  }) => {
    const { ref, handleRef, isDragging } = useSortable({
      id: section.id,
      index: sectionIndex,
      type: 'section',
      accept: ['section', 'field'],
      collisionPriority: CollisionPriority.Low,
      plugins: [Feedback.configure({feedback: 'clone'})],
    })

    return (
      <div
        ref={ref}
        data-section-id={section.id}
        className={cn('mb-4', isDragging && 'opacity-50')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleElementDrop(e, sectionIndex)}
      >
        {renderSectionCard(section, sectionIndex, handleRef)}
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

  const sensors = (defaults: Sensors) => [
    ...defaults.filter((sensor) => sensor !== PointerSensor),
    PointerSensor.configure({
      activationConstraints(event: PointerEvent, source) {
        if (event.pointerType === 'touch') {
          return [
            new PointerActivationConstraints.Delay({
              value: 500,
              tolerance: { x: 5, y: 5 },
            }),
          ]
        }
        return [new PointerActivationConstraints.Distance({ value: 8 })]
      },
    }),
  ]

  const findFieldById = (id: string | number) => {
    const currentPage = formStructure.pages[currentPageIndex]
    if (!currentPage) return null

    for (const section of currentPage.sections) {
      const field = section.fields.find((f) => f.id === id)
      if (field) return field
    }

    return null
  }

  const sectionIndexFromId = (id: string | number | undefined) => {
    if (id == null) return null
    const page = formStructure.pages[currentPageIndex]
    if (!page) return null
    const index = page.sections.findIndex((s) => s.id === id)
    return index === -1 ? null : index
  }

  const sectionIndexFromTarget = (target: Droppable | null | undefined) => {
    if (target == null || !isSortable(target as never)) return null
    if (target.type === 'section') {
      return sectionIndexFromId(target.id)
    }
    if (target.type === 'field') {
      return sectionIndexFromId(
        (target as { group?: string | number }).group,
      )
    }
    return null
  }

  const formStructureSnapshot = useRef<IFormStructure | null>(null)

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation
    if (!isSortable(source) || !isSortable(target)) return

    // Cross-group field->field: keep the OptimisticSortingPlugin from
    // physically moving the field element between containers; the commit
    // in handleDragEnd drives the state change instead
    if (
      source.type === 'field' &&
      target.type === 'field' &&
      source.group !== target.group
    ) {
      event.preventDefault()
      return
    }

    if (source.type !== 'field' || target.type !== 'section') return

    // Dropping a field into an empty section: the OptimisticSortingPlugin
    // cannot handle container targets, so drive the move via React state
    event.preventDefault()

    const targetSectionIndex = sectionIndexFromId(target.id)
    if (targetSectionIndex == null) return

    setFormStructure((prev) => {
      if (!prev) return prev
      const page = prev.pages[currentPageIndex]
      if (!page) return prev

      let sourceSectionIndex = -1
      let field: FieldConfig | undefined
      for (let i = 0; i < page.sections.length; i++) {
        field = page.sections[i].fields.find((f) => f.id === source.id)
        if (field) {
          sourceSectionIndex = i
          break
        }
      }
      if (!field || sourceSectionIndex === -1) return prev
      if (sourceSectionIndex === targetSectionIndex) return prev

      const sections = page.sections.map((s) => ({ ...s, fields: [...s.fields] }))
      sections[sourceSectionIndex].fields = sections[
        sourceSectionIndex
      ].fields.filter((f) => f.id !== source.id)
      sections[targetSectionIndex].fields.push(field)

      return {
        ...prev,
        pages: prev.pages.map((p, pageIndex) =>
          pageIndex === currentPageIndex ? { ...p, sections } : p,
        ),
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { canceled, operation } = event
    if (canceled) {
      if (formStructureSnapshot.current) {
        setFormStructure(formStructureSnapshot.current)
      }
      return
    }

    const { source } = operation
    if (!isSortable(source)) return

    if (source.type === 'section') {
      const { initialIndex, index } = source

      if (initialIndex === index) return

      const prev = formStructure
      const currentPage = prev?.pages[currentPageIndex]
      if (!prev || !currentPage) return

      const sections = [...currentPage.sections]
      const [moved] = sections.splice(initialIndex, 1)
      sections.splice(index, 0, moved)

      setFormStructure({
        ...prev,
        pages: prev.pages.map((p, pageIndex) =>
          pageIndex === currentPageIndex ? { ...p, sections } : p,
        ),
      })

      setCurrentSectionIndex(index)
      return
    }

    if (source.type === 'field') {
      const { initialIndex, index, initialGroup, group } = source
      if (initialGroup == null) return

      const sourceSectionIndex = sectionIndexFromId(initialGroup)
      if (sourceSectionIndex == null) return

      const target = operation.target
      const targetIsField =
        target != null && isSortable(target) && target.type === 'field'

      const pluginMovedCrossGroup = group != null && group !== initialGroup
      const targetSectionIndex = pluginMovedCrossGroup
        ? sectionIndexFromId(group)
        : targetIsField
          ? sectionIndexFromId(
              (target as { group?: string | number }).group,
            )
          : sectionIndexFromId(group)

      if (targetSectionIndex == null) return

      const sameSection = targetSectionIndex === sourceSectionIndex
      if (sameSection && initialIndex === index && !pluginMovedCrossGroup) {
        return
      }

      const prev = formStructure
      const page = prev?.pages[currentPageIndex]
      if (!prev || !page) return

      const sections = page.sections.map((s) => ({
        ...s,
        fields: [...s.fields],
      }))
      const sourceSection = sections[sourceSectionIndex]
      const targetSection = sections[targetSectionIndex]
      if (!sourceSection || !targetSection) return

      const [moved] = sourceSection.fields.splice(initialIndex, 1)
      if (!moved) return

      if (sameSection) {
        targetSection.fields.splice(index, 0, moved)
      } else if (targetIsField) {
        const targetIndex =
          (target as { index?: number }).index ?? targetSection.fields.length
        targetSection.fields.splice(
          Math.min(targetIndex, targetSection.fields.length),
          0,
          moved,
        )
      } else {
        targetSection.fields.push(moved)
      }

      setFormStructure({
        ...prev,
        pages: prev.pages.map((p, pageIndex) =>
          pageIndex === currentPageIndex ? { ...p, sections } : p,
        ),
      })
    }
  }

  const handleRemoveField = (id: string) => {
    updateCurrentFields((prev) => prev.filter((field) => field.id !== id))
  }

  const renderFieldCard = (field: FieldConfig) => {
    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    return (
      <div className="relative flex items-start gap-2 bg-card rounded-lg border-2 border-dashed border-border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing">
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
    )
  }

  const SortableFieldItem = ({
    field,
    index,
    sectionIndex,
    sectionId,
  }: {
    field: FieldConfig
    index: number
    sectionIndex: number
    sectionId: string
  }) => {
    const { ref, isDragging } = useSortable({
      id: field.id,
      index,
      type: 'field',
      accept: 'field',
      group: sectionId,
      plugins: [Feedback.configure({feedback: 'clone'})],
    })

    return (
      <div
        ref={ref}
        data-field-id={field.id}
        className={cn('mb-4 group', isDragging && 'opacity-50')}
      >
        {renderFieldCard(field)}
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

        const raw = form.data.fields as unknown
        if (
          raw &&
          typeof raw === 'object' &&
          !Array.isArray(raw) &&
          Array.isArray((raw as { pages?: unknown }).pages)
        ) {
          const loaded = raw as IFormStructure
          setFormStructure({
            ...loaded,
            pages: loaded.pages.map((page) => ({
              ...page,
              sections: page.sections.map((section) => ({
                id: section.id ?? crypto.randomUUID(),
                fields: section.fields,
              })),
            })),
          })
        }
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
                    sections: [newSection()],
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
            <DragDropProvider
              sensors={sensors}
              onDragStart={(event) => {
                formStructureSnapshot.current = formStructure
              }}
              onDragOver={handleDragOver}
              onDragEnd={(event) => {
                handleDragEnd(event)
              }}
            >
              {formStructure.pages[currentPageIndex]?.sections.map(
                (section, sectionIndex) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    sectionIndex={sectionIndex}
                  />
                ),
              )}
            </DragDropProvider>
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
