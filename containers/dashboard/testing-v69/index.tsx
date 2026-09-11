'use client'

import ImportGoogleForm from '@/features/form-builder/core/import-google-form'
import GenerateWithAiPrompt from '@/features/form-builder/core/generate-with-ai'
import type { FieldConfig } from '@/features/form-builder/elements'
import {
  isFormStructure,
  type FormStructure as PersistedFormStructure,
} from '@/features/form-builder/form-structure'
import { CopyButton } from '@/features/form-builder/components/copy-button'
import { IMMORTAL_SENTINEL_DATE } from '@/features/form-builder/components/date-picker-with-presets'
import { useFormStore } from '@/features/form-builder/store'
import {
  AVAILABLE_FIELDS,
  type avaliableFieldsType,
} from '@/features/form-builder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
  getFieldEditor,
} from '@/features/form-builder/utils/helperFunctions'
import { SettingsDialog } from '@/features/form-builder/components/settings-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import type { CreateFormPayload } from '@/lib/validators/form'
import { getTemplateBySlug } from '@/containers/dashboard/templates/constants'
import { instantiateTemplate } from '@/containers/dashboard/templates/instantiate-template'
import { CollisionPriority } from '@dnd-kit/abstract'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  type DragDropEventHandlers,
  DragDropProvider,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import {
  Suspense,
  createElement,
  forwardRef,
  memo,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

import {
  CANVAS_DROP_ID,
  type DropTarget,
  type FormSection,
  type FormStructure,
  ITEM_TYPE,
  PALETTE_FIELD_TYPE,
  PALETTE_SECTION_TYPE,
  SECTION_GROUP_ID,
  SECTION_TYPE,
  createPage,
  createSection,
  fieldCount,
  findField,
  getPage,
  moveExistingField,
  removeField,
  removeSection,
  stagePaletteField,
  stagePaletteSection,
  updateField,
} from './drag-model'

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

const COMING_SOON_FIELDS = [
  'Combobox',
  'File Input',
  'Input OTP',
  'Location Input',
  'Password',
  'Phone',
  'Signature Input',
]

const PALETTE = AVAILABLE_FIELDS.map((fieldType, index) => ({
  id: `v69-palette-${fieldType}-${index}`,
  fieldType: fieldType as avaliableFieldsType,
}))

type FieldPreviewComponent = ComponentType<{
  field: FieldConfig
  value: undefined
  onChange: (value: unknown) => void
}>

type FieldEditorComponent = ComponentType<{
  field: FieldConfig
  onUpdate: (field: FieldConfig) => void
  onClose: () => void
  isOpen: boolean
}>

function FieldPreview({ field }: { field: FieldConfig }) {
  const FieldComponent = getFieldComponent(
    field.uniqueIdentifier,
  ) as unknown as FieldPreviewComponent

  return createElement(FieldComponent, {
    field: field as never,
    value: undefined,
    onChange: () => undefined,
  })
}

function FieldEditor({
  field,
  onUpdate,
  onClose,
}: {
  field: FieldConfig
  onUpdate: (field: FieldConfig) => void
  onClose: () => void
}) {
  const EditorComponent = getFieldEditor(
    field.uniqueIdentifier,
  ) as unknown as FieldEditorComponent

  return createElement(EditorComponent, {
    field,
    onUpdate,
    onClose,
    isOpen: true,
  })
}

interface ItemCardProps {
  field: FieldConfig
  floatingWidth?: number | null
  onEdit?: () => void
  onRemove?: () => void
  state?: 'ghost' | 'floating'
}

const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(function ItemCard(
  { field, floatingWidth, onEdit, onRemove, state },
  ref,
) {
  const isFloating = state === 'floating'

  return (
    <div
      ref={ref}
      style={isFloating && floatingWidth ? { width: floatingWidth } : undefined}
      className={cn(
        'group relative flex items-center justify-between rounded-lg border-2 border-dashed border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing',
        state === 'ghost' && 'opacity-30',
        isFloating && 'pointer-events-none shadow-2xl cursor-grabbing',
      )}
    >
      <div className="pointer-events-none flex-1 pr-2">
        <FieldPreview field={field} />
      </div>

      {!isFloating && onEdit && onRemove ? (
        <div
          className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-8 w-8 cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary"
            onClick={onEdit}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit {field.label}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-8 w-8 cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Remove {field.label}</span>
          </Button>
        </div>
      ) : null}
    </div>
  )
})

interface SectionCardProps {
  children?: ReactNode
  fieldSurfaceRef?: (element: HTMLDivElement | null) => void
  floatingWidth?: number | null
  hasDragHandle?: boolean
  handleRef?: (element: Element | null) => void
  isEmpty: boolean
  label: string
  state?: 'ghost' | 'floating'
}

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard(
    {
      children,
      fieldSurfaceRef,
      floatingWidth,
      hasDragHandle,
      handleRef,
      isEmpty,
      label,
      state,
    },
    ref,
  ) {
    const isFloating = state === 'floating'

    return (
      <div
        ref={ref}
        style={isFloating && floatingWidth ? { width: floatingWidth } : undefined}
        className={cn(
          'flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-opacity',
          state === 'ghost' && 'opacity-30',
          isFloating && 'pointer-events-none shadow-2xl cursor-grabbing',
        )}
      >
        <div
          ref={handleRef}
          className={cn(
            'flex items-center gap-2 text-sm font-medium text-neutral-400',
            hasDragHandle && 'cursor-grab active:cursor-grabbing',
          )}
        >
          <GripVerticalIcon className="size-4" />
          <span>{label}</span>
        </div>

        {isEmpty ? (
          <div
            ref={fieldSurfaceRef}
            className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-800 text-sm text-neutral-500"
          >
            Drop fields here
          </div>
        ) : (
          <div ref={fieldSurfaceRef} className="flex-1 space-y-3">
            {children}
          </div>
        )}
      </div>
    )
  },
)

interface SortableItemProps {
  field: FieldConfig
  index: number
  isPlaceholder?: boolean
  onEdit: () => void
  onRemove: () => void
  sectionId: string
}

const SortableItem = memo(function SortableItem({
  field,
  index,
  isPlaceholder,
  onEdit,
  onRemove,
  sectionId,
}: PropsWithChildren<SortableItemProps>) {
  const { isDragSource, ref } = useSortable({
    id: field.id,
    group: sectionId,
    accept: [ITEM_TYPE, PALETTE_FIELD_TYPE],
    type: ITEM_TYPE,
    index,
    data: { sectionId },
  })

  return (
    <ItemCard
      ref={ref}
      field={field}
      onEdit={onEdit}
      onRemove={onRemove}
      state={isDragSource || isPlaceholder ? 'ghost' : undefined}
    />
  )
})

interface SortableSectionProps {
  fields: FieldConfig[]
  id: string
  index: number
  isPlaceholder?: boolean
  label: string
  onEditField: (field: FieldConfig) => void
  onFieldSurfaceRef: (id: string, element: HTMLDivElement | null) => void
  onRemoveField: (fieldId: string) => void
  placeholderFieldId?: string | null
}

const SortableSection = memo(function SortableSection({
  fields,
  id,
  index,
  isPlaceholder,
  label,
  onEditField,
  onFieldSurfaceRef,
  onRemoveField,
  placeholderFieldId,
}: PropsWithChildren<SortableSectionProps>) {
  const { handleRef, isDragSource, ref } = useSortable({
    id,
    group: SECTION_GROUP_ID,
    accept: [SECTION_TYPE, ITEM_TYPE, PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE],
    collisionPriority: CollisionPriority.Low,
    type: SECTION_TYPE,
    index,
    data: { sectionId: id },
  })
  const { ref: fieldSurfaceDropRef } = useDroppable({
    id: `v69-section-${id}-field-surface`,
    accept: [ITEM_TYPE, PALETTE_FIELD_TYPE],
    collisionPriority: CollisionPriority.Low,
    disabled: fields.length > 0,
    type: 'field-surface',
    data: { sectionId: id },
  })
  const setFieldSurfaceRef = useCallback(
    (element: HTMLDivElement | null) => {
      fieldSurfaceDropRef(element)
      onFieldSurfaceRef(id, element)
    },
    [fieldSurfaceDropRef, id, onFieldSurfaceRef],
  )

  return (
    <SectionCard
      ref={ref}
      label={label}
      isEmpty={fields.length === 0}
      hasDragHandle
      handleRef={handleRef}
      fieldSurfaceRef={setFieldSurfaceRef}
      state={isDragSource || isPlaceholder ? 'ghost' : undefined}
    >
      {fields.map((field, fieldIndex) => (
        <SortableItem
          key={field.id}
          field={field}
          index={fieldIndex}
          isPlaceholder={field.id === placeholderFieldId}
          onEdit={() => onEditField(field)}
          onRemove={() => onRemoveField(field.id)}
          sectionId={id}
        />
      ))}
    </SectionCard>
  )
})

const PaletteFieldRow = memo(function PaletteFieldRow({
  fieldType,
  id,
  onAdd,
}: {
  fieldType: avaliableFieldsType
  id: string
  onAdd: (fieldType: avaliableFieldsType) => void
}) {
  const { isDragSource, ref } = useSortable({
    id,
    group: 'v69-palette',
    accept: () => false,
    type: PALETTE_FIELD_TYPE,
    index: PALETTE.findIndex((item) => item.id === id),
    data: { fieldType },
  })

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-full cursor-grab rounded-lg bg-neutral-900! px-2 md:pl-3',
        isDragSource && 'opacity-30',
      )}
      onClick={() => onAdd(fieldType)}
    >
      <span className="overflow-hidden truncate text-[0.625rem] md:text-xs">
        {fieldType}
      </span>
      <GripVerticalIcon className="ml-auto size-4" />
    </button>
  )
})

const PaletteSectionRow = memo(function PaletteSectionRow({
  onAdd,
}: {
  onAdd: () => void
}) {
  const { isDragSource, ref } = useSortable({
    id: 'v69-palette-section',
    group: 'v69-palette',
    accept: () => false,
    type: PALETTE_SECTION_TYPE,
    index: 0,
  })

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-full cursor-grab rounded-lg bg-neutral-900! px-2 md:pl-3',
        isDragSource && 'opacity-30',
      )}
      onClick={onAdd}
    >
      <span className="flex flex-1 items-center gap-2 text-left text-[0.625rem] md:text-xs">
        <GripVerticalIcon className="size-4" />
        Section
      </span>
      <span className="text-muted-foreground">Add</span>
    </button>
  )
})

function CanvasDropSurface({
  children,
  hasSections,
  onCanvasRef,
}: {
  children: ReactNode
  hasSections: boolean
  onCanvasRef: (element: HTMLDivElement | null) => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: CANVAS_DROP_ID,
    accept: [PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE],
    collisionPriority: CollisionPriority.Low,
    type: 'canvas',
  })
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      ref(element)
      onCanvasRef(element)
    },
    [onCanvasRef, ref],
  )

  return (
    <div
      ref={setRef}
      className={cn('w-full', !hasSections && 'h-full')}
    >
      {hasSections ? (
        children
      ) : (
        <div
          className={cn(
            'flex h-full min-h-80 items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground transition-colors',
            isDropTarget && 'border-primary bg-primary/10 text-primary',
          )}
        >
          <p>
            {isDropTarget
              ? 'Drop field or section here'
              : 'Drag elements here to build your form or Generate with AI'}
          </p>
        </div>
      )}
    </div>
  )
}

interface EditingField {
  field: FieldConfig
  pageId: string
  sectionId: string
}

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

function createInitialState() {
  const firstPage = createPage()

  return {
    activePageId: firstPage.id,
    formStructure: { pages: [firstPage] } satisfies FormStructure,
  }
}

export default function TestingV69Page({ params }: FormBuilderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading builder...
        </div>
      }
    >
      <TestingV69Builder params={params} />
    </Suspense>
  )
}

function TestingV69Builder({ params }: FormBuilderProps) {
  const { slug: paramFormId } = use(params)
  const initialState = useState(createInitialState)[0]
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template')
  const { formSettings, setFormSettings } = useFormStore()
  const [currentFormId, setCurrentFormId] = useState(paramFormId)
  const [activePageId, setActivePageId] = useState(initialState.activePageId)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [formStructure, setFormStructure] = useState<FormStructure>(
    initialState.formStructure,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [hasInvalidPersistedStructure, setHasInvalidPersistedStructure] =
    useState(false)
  const [paletteFieldPlaceholderId, setPaletteFieldPlaceholderId] = useState<
    string | null
  >(null)
  const [paletteSectionPlaceholderId, setPaletteSectionPlaceholderId] =
    useState<string | null>(null)
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null)
  const [fieldOverlayWidth, setFieldOverlayWidth] = useState<number | null>(
    null,
  )

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const fieldSurfaceRefs = useRef(new Map<string, HTMLDivElement>())
  const formStructureSnapshot = useRef<FormStructure | null>(null)
  const paletteFieldClone = useRef<FieldConfig | null>(null)
  const paletteSectionClone = useRef<FormSection | null>(null)
  const palettePlacement = useRef(false)

  const isExistingForm = currentFormId !== 'new-form'
  const isNewForm = !isExistingForm

  const activePage =
    getPage(formStructure, activePageId) ?? formStructure.pages[0]
  const resolvedActivePageId = activePage.id
  const hasCanvasSections = activePage.sections.length > 0

  const registerCanvas = useCallback((element: HTMLDivElement | null) => {
    canvasRef.current = element
  }, [])

  const registerFieldSurface = useCallback(
    (sectionId: string, element: HTMLDivElement | null) => {
      if (element) {
        fieldSurfaceRefs.current.set(sectionId, element)
      } else {
        fieldSurfaceRefs.current.delete(sectionId)
      }
    },
    [],
  )

  const setFieldOverlayWidthFromSurface = useCallback(
    (surface: HTMLDivElement | undefined) => {
      if (!surface) return

      const width = surface.getBoundingClientRect().width
      setFieldOverlayWidth((currentWidth) =>
        currentWidth !== null && Math.abs(currentWidth - width) < 0.5
          ? currentWidth
          : width,
      )
    },
    [],
  )

  const measureFieldSurface = useCallback(
    (target: DropTarget | null | undefined) => {
      const targetData = target?.data as { sectionId?: unknown } | undefined
      const targetId = String(target?.id ?? '')
      const sectionId =
        (typeof targetData?.sectionId === 'string'
          ? targetData.sectionId
          : undefined) ??
        activePage.sections.find((section) => section.id === targetId)?.id ??
        findField(activePage, targetId)?.section.id

      setFieldOverlayWidthFromSurface(
        sectionId ? fieldSurfaceRefs.current.get(sectionId) : undefined,
      )
    },
    [activePage, setFieldOverlayWidthFromSurface],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasWidth = () => {
      setCanvasWidth(canvas.getBoundingClientRect().width)
    }

    updateCanvasWidth()
    const observer = new ResizeObserver(updateCanvasWidth)
    observer.observe(canvas)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const clone = paletteFieldClone.current
    if (!clone) return

    const location = findField(activePage, clone.id)
    setFieldOverlayWidthFromSurface(
      location ? fieldSurfaceRefs.current.get(location.section.id) : undefined,
    )
  }, [activePage, setFieldOverlayWidthFromSurface])

  const form = useQuery({
    queryKey: ['form', currentFormId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/forms/${currentFormId}`)
      return data
    },
    enabled: isExistingForm,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    setCurrentFormId(paramFormId)
  }, [paramFormId])

  useEffect(() => {
    if (!isExistingForm) return

    if (form.isError) {
      toast.error('Failed to load form')
      return
    }

    if (!form.isSuccess || !form.data) return

    if (!isFormStructure(form.data.fields)) {
      setHasInvalidPersistedStructure(true)
      toast.error('Form structure is invalid')
      return
    }

    setHasInvalidPersistedStructure(false)
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
    setFormStructure(form.data.fields as PersistedFormStructure)
    setActivePageId(form.data.fields.pages[0]?.id ?? initialState.activePageId)
    // Hydration is intentionally driven by the query result, not the store
    // writes performed inside this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExistingForm, form.data, form.isError, form.isSuccess])

  useEffect(() => {
    if (!isNewForm || !templateSlug) return

    const template = getTemplateBySlug(templateSlug)
    if (!template) {
      toast.error('Template not found')
      return
    }

    const structure = instantiateTemplate(template)
    setFormStructure(structure)
    setActivePageId(structure.pages[0]?.id ?? initialState.activePageId)
    setFormSettings({
      ...formSettings,
      title: template.title,
      description: template.description,
      submitButtonText: template.submitButtonText,
    })
    toast.success(`Loaded template: ${template.title}`)
    // A template is an initialization input: apply it once per template URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewForm, templateSlug])

  const addPage = useCallback(() => {
    const page = createPage()
    setFormStructure((prev) => ({
      ...prev,
      pages: [...prev.pages, page],
    }))
    setActivePageId(page.id)
  }, [])

  const addSection = useCallback(() => {
    const section = createSection()
    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === resolvedActivePageId
          ? { ...page, sections: [...page.sections, section] }
          : page,
      ),
    }))
  }, [resolvedActivePageId])

  const addField = useCallback(
    (fieldType: avaliableFieldsType) => {
      const field = createDefaultFieldConfig(fieldType)
      setFormStructure((prev) => {
        const page = getPage(prev, resolvedActivePageId)
        if (!page) return prev

        const target: DropTarget = { id: CANVAS_DROP_ID }
        return stagePaletteField(prev, resolvedActivePageId, field, target)
          .structure
      })
    },
    [resolvedActivePageId],
  )

  const removeFieldById = useCallback(
    (sectionId: string, fieldId: string) => {
      setFormStructure((prev) =>
        removeField(prev, resolvedActivePageId, sectionId, fieldId),
      )
      setEditingField((current) =>
        current?.sectionId === sectionId && current.field.id === fieldId
          ? null
          : current,
      )
    },
    [resolvedActivePageId],
  )

  const replaceWithImportedFields = useCallback(
    (title: string, description: string, fields: FieldConfig[]) => {
      const page = createPage()
      page.sections = [{ ...createSection(), fields }]
      setFormStructure({ pages: [page] })
      setActivePageId(page.id)
      setFormSettings({ ...formSettings, title, description })
    },
    [formSettings, setFormSettings],
  )

  const handleSaveForm = useCallback(async () => {
    if (hasInvalidPersistedStructure) {
      toast.error('Fix the form structure before saving')
      return
    }

    if (!formSettings.title.trim()) {
      toast.error('Form name is required')
      return
    }

    if (fieldCount(formStructure) === 0) {
      toast.error('Add at least one field before saving')
      return
    }

    setIsSaving(true)
    try {
      const payload: CreateFormPayload = {
        title: formSettings.title,
        description: formSettings.description?.trim() || null,
        fields: formStructure,
        maxSubmissions: formSettings.maxSubmissions
          ? Number.isNaN(formSettings.maxSubmissions)
            ? null
            : formSettings.maxSubmissions
          : null,
        expiresAt: formSettings.expiresAt,
        redirectUrl: formSettings.redirectUrl?.trim() || null,
        submitButtonText: formSettings.submitButtonText?.trim() || null,
      }
      if (isNewForm) {
        const { data } = await axios.post('/api/forms/new', payload)
        setCurrentFormId(data.id)
        window.history.replaceState(null, '', `/dashboard/builder/${data.id}`)
        toast.success('Form created successfully')
      } else {
        await axios.post(`/api/forms/${currentFormId}/update`, payload)
        toast.success('Form updated successfully')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const issues = error.response.data?.issues as
          | { field: string; message: string }[]
          | undefined
        toast.error('Validation error', {
          description: issues?.length
            ? issues.map((issue) => `• ${issue.field}: ${issue.message}`).join('\n')
            : 'Please check your form fields and try again.',
          style: { whiteSpace: 'pre-line' },
        })
        return
      }

      toast.error(isNewForm ? 'Failed to create form' : 'Failed to update form')
    } finally {
      setIsSaving(false)
    }
  }, [
    currentFormId,
    formSettings,
    formStructure,
    hasInvalidPersistedStructure,
    isNewForm,
  ])

  const resetPaletteDrag = useCallback(() => {
    paletteFieldClone.current = null
    paletteSectionClone.current = null
    palettePlacement.current = false
    setPaletteFieldPlaceholderId(null)
    setPaletteSectionPlaceholderId(null)
    setFieldOverlayWidth(null)
  }, [])

  const handleDragStart = useCallback<
    DragDropEventHandlers['onDragStart']
  >(
    (event) => {
      const { source } = event.operation
      if (!source) return

      formStructureSnapshot.current = structuredClone(formStructure)
      palettePlacement.current = false

      if (source.type === PALETTE_FIELD_TYPE) {
        const sourceData = source.data as { fieldType?: unknown } | undefined
        const fieldType = sourceData?.fieldType
        if (typeof fieldType !== 'string') return

        const field = createDefaultFieldConfig(fieldType as avaliableFieldsType)
        field.id = `palette_${crypto.randomUUID().slice(0, 8)}`
        paletteFieldClone.current = field
        setPaletteFieldPlaceholderId(field.id)
        setFieldOverlayWidth(null)
        return
      }

      if (source.type === PALETTE_SECTION_TYPE) {
        const section = createSection()
        paletteSectionClone.current = section
        setPaletteSectionPlaceholderId(section.id)
        return
      }

      if (source.type === ITEM_TYPE) {
        measureFieldSurface(source as unknown as DropTarget)
      }
    },
    [formStructure, measureFieldSurface],
  )

  const handleDragOver = useCallback<DragDropEventHandlers['onDragOver']>(
    (event) => {
      const { source, target } = event.operation
      if (!source) return

      const targetWithPlacement: DropTarget | null = target
        ? {
            id: target.id,
            index: (target as unknown as DropTarget).index,
            data: target.data,
            insertAfter:
              Boolean(target.shape) &&
              event.operation.position.current.y > target.shape!.center.y,
          }
        : null

      if (source.type === PALETTE_FIELD_TYPE) {
        event.preventDefault()
        const field = paletteFieldClone.current
        if (!field) return

        if (!target || !targetWithPlacement) {
          palettePlacement.current = false
          setFormStructure((prev) =>
            removeField(
              prev,
              resolvedActivePageId,
              findField(getPage(prev, resolvedActivePageId), field.id)?.section
                .id ?? '',
              field.id,
            ),
          )
          return
        }

        measureFieldSurface(targetWithPlacement)
        // React may defer the state updater until after dragend. Record the
        // accepted target before scheduling it so a valid palette drop cannot
        // be mistaken for an outside drop.
        palettePlacement.current = true
        setFormStructure((prev) => {
          const result = stagePaletteField(
            prev,
            resolvedActivePageId,
            field,
            targetWithPlacement,
          )
          return result.structure
        })
        return
      }

      if (source.type === PALETTE_SECTION_TYPE) {
        event.preventDefault()
        const section = paletteSectionClone.current
        if (!section) return

        if (!target || !targetWithPlacement) {
          palettePlacement.current = false
          setFormStructure((prev) =>
            removeSection(prev, resolvedActivePageId, section.id),
          )
          return
        }

        // See the equivalent palette-field branch: this must be synchronous.
        palettePlacement.current = true
        setFormStructure((prev) => {
          const result = stagePaletteSection(
            prev,
            resolvedActivePageId,
            section,
            targetWithPlacement,
          )
          return result.structure
        })
        return
      }

      if (source.type === SECTION_TYPE && target) {
        const targetId = String(target.id)
        setFormStructure((prev) => {
          const page = getPage(prev, resolvedActivePageId)
          if (!page || !page.sections.some((section) => section.id === targetId)) {
            return prev
          }

          const sections = move(page.sections, event)
          return {
            ...prev,
            pages: prev.pages.map((candidate) =>
              candidate.id === resolvedActivePageId
                ? { ...candidate, sections }
                : candidate,
            ),
          }
        })
        return
      }

      if (source.type === ITEM_TYPE && target && targetWithPlacement) {
        measureFieldSurface(targetWithPlacement)
        setFormStructure((prev) => {
          const page = getPage(prev, resolvedActivePageId)
          const sourceField = findField(page, String(source.id))
          const targetField = findField(page, String(target.id))

          if (
            page &&
            sourceField &&
            targetField &&
            sourceField.section.id === targetField.section.id
          ) {
            const fields = move(sourceField.section.fields, event)
            return {
              ...prev,
              pages: prev.pages.map((candidate) =>
                candidate.id === resolvedActivePageId
                  ? {
                      ...candidate,
                      sections: candidate.sections.map((section) =>
                        section.id === sourceField.section.id
                          ? { ...section, fields }
                          : section,
                      ),
                    }
                  : candidate,
              ),
            }
          }

          return moveExistingField(
            prev,
            resolvedActivePageId,
            String(source.id),
            targetWithPlacement,
          )
        })
      }
    },
    [measureFieldSurface, resolvedActivePageId],
  )

  const handleDragEnd = useCallback<DragDropEventHandlers['onDragEnd']>(
    (event) => {
      const sourceType = event.operation.source?.type
      const isPaletteSource =
        sourceType === PALETTE_FIELD_TYPE ||
        sourceType === PALETTE_SECTION_TYPE
      const shouldRestore =
        event.canceled ||
        (isPaletteSource
          ? !palettePlacement.current
          : !event.operation.target)

      if (shouldRestore && formStructureSnapshot.current) {
        setFormStructure(formStructureSnapshot.current)
      }

      formStructureSnapshot.current = null
      resetPaletteDrag()
    },
    [resetPaletteDrag],
  )

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-background text-foreground">
        <Card className="hidden h-screen w-80 overflow-hidden rounded-none border-0 border-r-2 md:block">
          <CardContent className="flex h-full flex-col space-y-4 p-4 py-0">
            <div className="mb-8 flex flex-row justify-between">
              <h2 className="text-2xl font-bold">Settings</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveForm}
                disabled={isSaving || hasInvalidPersistedStructure}
                className="cursor-pointer text-xs"
              >
                {isSaving ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SaveIcon />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="v69-title">Form title</Label>
              <Input
                id="v69-title"
                placeholder="Enter form name"
                value={formSettings.title}
                onChange={(event) =>
                  setFormSettings({
                    ...formSettings,
                    title: event.target.value,
                  })
                }
                className="bg-neutral-900!"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="v69-description">Description</Label>
              <Textarea
                id="v69-description"
                placeholder="Enter description"
                value={formSettings.description}
                onChange={(event) =>
                  setFormSettings({
                    ...formSettings,
                    description: event.target.value,
                  })
                }
                className="max-h-24 bg-neutral-900!"
              />
            </div>

            <SettingsDialog />
            <div className="flex-grow" />
            <ImportGoogleForm onImported={replaceWithImportedFields} />
            <GenerateWithAiPrompt onGeneratedFields={replaceWithImportedFields} />
          </CardContent>
        </Card>

        <ScrollArea className="sticky flex-1 overflow-auto p-4 pt-6 md:p-4 md:pt-6">
          <div className="flex flex-row justify-between">
            <h1 className="mb-6 text-3xl font-bold">Builder</h1>
            <div className="flex gap-2">
              {isExistingForm ? (
                <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer"
                onClick={handleSaveForm}
                disabled={isSaving || hasInvalidPersistedStructure}
              >
                {isSaving ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SaveIcon />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-1 border-b">
            {formStructure.pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePageId(page.id)}
                className={cn(
                  'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  page.id === resolvedActivePageId
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                Page {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={addPage}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <PlusIcon className="size-4" />
              Add page
            </button>
          </div>

          <Card
            className={cn(
              'mb-1 h-[calc(100vh-144px)] overflow-y-scroll border-2 border-dashed border-muted !p-0',
              !hasCanvasSections && 'flex items-center justify-center',
            )}
          >
            <CardContent
              className={cn(
                'p-3 md:p-4',
                !hasCanvasSections && 'flex h-full w-full items-center justify-center',
              )}
            >
              <CanvasDropSurface
                hasSections={hasCanvasSections}
                onCanvasRef={registerCanvas}
              >
                <div className="mx-auto min-h-full font-sans text-white">
                  <div className="space-y-4 pb-8">
                    {activePage.sections.map((section, sectionIndex) => (
                      <SortableSection
                        key={section.id}
                        id={section.id}
                        index={sectionIndex}
                        label={`Section ${sectionIndex + 1}`}
                        fields={section.fields}
                        isPlaceholder={
                          section.id === paletteSectionPlaceholderId
                        }
                        placeholderFieldId={paletteFieldPlaceholderId}
                        onFieldSurfaceRef={registerFieldSurface}
                        onEditField={(field) =>
                          setEditingField({
                            field,
                            pageId: resolvedActivePageId,
                            sectionId: section.id,
                          })
                        }
                        onRemoveField={(fieldId) =>
                          removeFieldById(section.id, fieldId)
                        }
                      />
                    ))}
                  </div>
                </div>
              </CanvasDropSurface>
            </CardContent>
          </Card>
        </ScrollArea>

        <Card className="hidden h-screen w-80 overflow-hidden rounded-none border-0 border-l-2 md:block">
          <CardContent className="p-4 pt-0">
            <h2 className="text-2xl font-bold">Available Fields</h2>
            <CardDescription>
              Drag to place, or click to add to first section.
            </CardDescription>
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="flex flex-row">
                <div className="grid w-full grid-cols-2 flex-wrap items-start gap-2 gap-y-2 overflow-y-auto md:flex md:flex-col md:flex-nowrap">
                  <p className="col-span-2 mb-1 text-xs font-medium text-muted-foreground md:w-full">
                    Layout
                  </p>
                  <PaletteSectionRow onAdd={addSection} />
                  <Separator className="col-span-2 my-2 md:w-full" />
                  <p className="col-span-2 mb-1 text-xs font-medium text-muted-foreground md:w-full">
                    Fields
                  </p>
                  {PALETTE.map((entry) => (
                    <PaletteFieldRow
                      key={entry.id}
                      id={entry.id}
                      fieldType={entry.fieldType}
                      onAdd={addField}
                    />
                  ))}
                  <Separator className="col-span-2 my-2 md:w-full" />
                  {COMING_SOON_FIELDS.map((fieldType) => (
                    <Button
                      key={fieldType}
                      variant="outline"
                      className="w-full cursor-not-allowed rounded-lg bg-neutral-900! px-2 opacity-60 md:pl-3"
                      size="sm"
                      disabled
                    >
                      <span className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                        {fieldType}
                      </span>
                      <Badge
                        variant="outline"
                        className="mx-1 rounded-full bg-blue-400 px-1 py-0 text-[9px] font-bold text-black"
                      >
                        coming soon
                      </Badge>
                      <GripVerticalIcon className="ml-auto size-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {(source) => {
          if (!source) return null

          if (source.type === SECTION_TYPE) {
            if (!canvasWidth) return null

            const sectionIndex = activePage.sections.findIndex(
              (section) => section.id === source.id,
            )
            const section = activePage.sections[sectionIndex]
            if (!section) return null

            return (
              <SectionCard
                label={`Section ${sectionIndex + 1}`}
                isEmpty={section.fields.length === 0}
                state="floating"
                floatingWidth={canvasWidth}
              >
                {section.fields.map((field) => (
                  <ItemCard key={field.id} field={field} />
                ))}
              </SectionCard>
            )
          }

          if (source.type === ITEM_TYPE) {
            const field = findField(activePage, String(source.id))?.field
            if (!field || !fieldOverlayWidth) return null

            return (
              <ItemCard
                field={field}
                state="floating"
                floatingWidth={fieldOverlayWidth}
              />
            )
          }

          if (source.type === PALETTE_FIELD_TYPE) {
            const field = paletteFieldClone.current
            if (!field || !fieldOverlayWidth) return null

            return (
              <ItemCard
                field={field}
                state="floating"
                floatingWidth={fieldOverlayWidth}
              />
            )
          }

          if (source.type === PALETTE_SECTION_TYPE) {
            const section = paletteSectionClone.current
            if (!section || !canvasWidth) return null

            return (
              <SectionCard
                label="New section"
                isEmpty
                state="floating"
                floatingWidth={canvasWidth}
              />
            )
          }

          return null
        }}
      </DragOverlay>

      {editingField ? (
        <FieldEditor
          field={editingField.field}
          onUpdate={(field) => {
            setFormStructure((prev) =>
              updateField(
                prev,
                editingField.pageId,
                editingField.sectionId,
                field,
              ),
            )
            setEditingField(null)
          }}
          onClose={() => setEditingField(null)}
        />
      ) : null}
    </DragDropProvider>
  )
}
