'use client'

import ImportGoogleForm from '@/features/form-builder/core/import-google-form'
import GenerateWithAiPrompt from '@/features/form-builder/core/generate-with-ai'
import type { FieldConfig } from '@/features/form-builder/elements'
import {
  isFormStructure,
  sanitizeImportedFields,
  type FormStructure as PersistedFormStructure,
} from '@/features/form-builder/form-structure'
import { CopyButton } from '@/features/form-builder/components/copy-button'
import { IMMORTAL_SENTINEL_DATE } from '@/features/form-builder/components/date-picker-with-presets'
import { useFormStore } from '@/features/form-builder/store'
import {
  type avaliableFieldsType,
} from '@/features/form-builder/types/types'
import {
  createDefaultFieldConfig,
  getFieldEditor,
} from '@/features/form-builder/utils/helperFunctions'
import { SettingsDialog } from '@/features/form-builder/components/settings-dialog'
import { googleSheetsOAuthResultMessage } from '@/features/google-sheets/oauth-result'
import { GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM } from '@/features/google-sheets/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import type { CreateFormPayload } from '@/lib/validators/form'
import { getTemplateBySlug } from '@/containers/dashboard/templates/constants'
import { instantiateTemplate } from '@/containers/dashboard/templates/instantiate-template'
import { BuilderCanvas } from './components/builder-canvas'
import { ChromeTabStrip } from './components/chrome-tab-strip'
import { BuilderDragOverlay } from './components/builder-drag-overlay'
import { BuilderPalette } from './components/builder-palette'
import { SectionEditor } from './components/section-editor'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  type DragDropEventHandlers,
  DragDropProvider,
} from '@dnd-kit/react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  AnimatePresence,
  motion,
  type Variants,
  useReducedMotion,
} from 'motion/react'
import { Loader2Icon, SaveIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ComponentType } from 'react'
import {
  Suspense,
  createElement,
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
  type FormPage,
  type FormSection,
  type FormStructure,
  ITEM_TYPE,
  PALETTE_FIELD_TYPE,
  PALETTE_SECTION_TYPE,
  SECTION_TYPE,
  createPage,
  createSection,
  fieldCount,
  findField,
  getPage,
  moveExistingField,
  removeField,
  removePage,
  removeSection,
  stagePaletteField,
  stagePaletteSection,
  updateField,
  updateSection,
} from './drag-model'

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

type FieldEditorComponent = ComponentType<{
  field: FieldConfig
  onUpdate: (field: FieldConfig) => void
  onClose: () => void
  isOpen: boolean
}>

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

interface EditingField {
  field: FieldConfig
  pageId: string
  sectionId: string
}

interface EditingSection {
  pageId: string
  section: FormSection
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

// Stable fallback for unreachable empty-pages state (see activePage below).
// Module scope keeps hook deps stable; never written, only read.
const EMPTY_PAGE_FALLBACK: FormPage = { id: '', sections: [] }

export default function BuilderPage({ params }: FormBuilderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading builder...
        </div>
      }
    >
      <Builder params={params} />
    </Suspense>
  )
}

function Builder({ params }: FormBuilderProps) {
  const { slug: paramFormId } = use(params)

  return (
    <BuilderContent
      key={paramFormId}
      paramFormId={paramFormId}
    />
  )
}

function BuilderContent({
  paramFormId,
}: {
  paramFormId: string
}) {
  const initialState = useState(createInitialState)[0]
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template')
  const googleSheetsResult = searchParams.get(GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM)
  const { formSettings, setFormSettings } = useFormStore()
  const [currentFormId, setCurrentFormId] = useState(paramFormId)
  const [activePageId, setActivePageId] = useState(initialState.activePageId)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editingSection, setEditingSection] = useState<EditingSection | null>(null)
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
  const canvasObserverRef = useRef<ResizeObserver | null>(null)
  const fieldSurfaceRefs = useRef(new Map<string, HTMLDivElement>())
  const formStructureSnapshot = useRef<FormStructure | null>(null)
  const paletteFieldClone = useRef<FieldConfig | null>(null)
  const paletteSectionClone = useRef<FormSection | null>(null)
  const palettePlacement = useRef(false)

  const isExistingForm = currentFormId !== 'new-form'
  const isNewForm = !isExistingForm

  useEffect(() => {
    if (!googleSheetsResult) return

    const result = googleSheetsOAuthResultMessage(googleSheetsResult)
    toast[result.type](result.message)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete(GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM)
    const query = nextParams.toString()
    router.replace(`/dashboard/builder/${paramFormId}${query ? `?${query}` : ''}`)
  }, [googleSheetsResult, paramFormId, router, searchParams])

  const activePage =
    getPage(formStructure, activePageId) ??
    formStructure.pages[0] ??
    EMPTY_PAGE_FALLBACK
  const resolvedActivePageId = activePage.id
  const hasCanvasSections = activePage.sections.length > 0
  const shouldReduceMotion = useReducedMotion()
  const activePageIndex = formStructure.pages.findIndex(
    (page) => page.id === resolvedActivePageId,
  )
  const pageTransitionDirection = useRef(0)

  const selectPage = useCallback(
    (pageId: string) => {
      const nextIndex = formStructure.pages.findIndex(
        (page) => page.id === pageId,
      )
      if (
        nextIndex !== -1 &&
        activePageIndex !== -1 &&
        nextIndex !== activePageIndex
      ) {
        pageTransitionDirection.current = nextIndex > activePageIndex ? 1 : -1
      }
      setActivePageId(pageId)
    },
    [formStructure.pages, activePageIndex],
  )

  const pageTransitionVariants: Variants = {
    initial: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            x: direction > 0 ? 80 : direction < 0 ? -80 : 0,
            scale: 0.98,
            filter: 'blur(8px)',
          },
    animate: shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
    exit: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            x: direction > 0 ? -80 : direction < 0 ? 80 : 0,
            scale: 0.98,
            filter: 'blur(8px)',
          },
  }

  const registerCanvas = useCallback((element: HTMLDivElement | null) => {
    if (!element) {
      // A null detach can come from an exiting (superseded) canvas that
      // unmounts after the new canvas attached. Never kill the live
      // observer here; full unmount is handled by the effect cleanup below.
      return
    }

    canvasObserverRef.current?.disconnect()
    canvasObserverRef.current = null
    canvasRef.current = element

    const updateCanvasWidth = () => {
      setCanvasWidth(element.getBoundingClientRect().width)
    }

    updateCanvasWidth()
    const observer = new ResizeObserver(updateCanvasWidth)
    observer.observe(element)
    canvasObserverRef.current = observer
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
    // Re-sync after StrictMode's mount → unmount → remount cycle in dev,
    // which runs the cleanup below without re-invoking the canvas ref.
    const node = canvasRef.current
    if (node && !canvasObserverRef.current) {
      registerCanvas(node)
    }

    return () => {
      canvasObserverRef.current?.disconnect()
      canvasObserverRef.current = null
    }
  }, [registerCanvas])

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
    pageTransitionDirection.current = 1
    setFormStructure((prev) => ({
      ...prev,
      pages: [...prev.pages, page],
    }))
    setActivePageId(page.id)
  }, [])

  const removePageById = useCallback(
    (pageId: string) => {
      const pageIndex = formStructure.pages.findIndex(
        (page) => page.id === pageId,
      )
      const nextStructure = removePage(formStructure, pageId)
      if (nextStructure === formStructure) return

      if (pageId === resolvedActivePageId) {
        if (pageIndex > 0) {
          pageTransitionDirection.current = -1
        }
        setActivePageId(
          nextStructure.pages[Math.max(0, pageIndex - 1)].id,
        )
      }

      setEditingField((current) =>
        current?.pageId === pageId ? null : current,
      )
      setEditingSection((current) =>
        current?.pageId === pageId ? null : current,
      )
      setFormStructure(nextStructure)
    },
    [formStructure, resolvedActivePageId],
  )

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

  const removeSectionById = useCallback(
    (sectionId: string) => {
      setFormStructure((prev) =>
        removeSection(prev, resolvedActivePageId, sectionId),
      )
      setEditingSection((current) =>
        current?.section.id === sectionId ? null : current,
      )
    },
    [resolvedActivePageId],
  )

  const replaceWithImportedFields = useCallback(
    (title: string, description: string, fields: FieldConfig[]) => {
      // AI generation and Google import produce unvalidated payloads. Sanitize
      // before they enter builder state so unknown types or duplicate ids can
      // never brick the canvas.
      const cleanFields = sanitizeImportedFields(fields)
      if (cleanFields.length === 0) {
        toast.error('Import produced no usable fields')
        return
      }
      const page = createPage()
      page.sections = [{ ...createSection(), fields: cleanFields }]
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
      <div className="flex h-screen min-w-0 bg-background text-foreground">
        <Card className="hidden h-screen w-80 overflow-hidden rounded-none border-0 border-r-2 md:block">
          <CardContent className="flex h-full flex-col space-y-4 p-4 py-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Settings</h2>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="builder-title">Form title</Label>
              <Input
                id="builder-title"
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
              <Label htmlFor="builder-description">Description</Label>
              <Textarea
                id="builder-description"
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

            <SettingsDialog formId={isExistingForm ? currentFormId : null} />
            <div className="flex-grow" />
            <ImportGoogleForm onImported={replaceWithImportedFields} />
            <GenerateWithAiPrompt onGeneratedFields={replaceWithImportedFields} />
          </CardContent>
        </Card>

        <ScrollArea className="sticky min-w-0 flex-1 overflow-auto bg-card [&_[data-radix-scroll-area-viewport]>div]:w-full [&_[data-radix-scroll-area-viewport]>div]:table-fixed">
          <div className="flex flex-row justify-between bg-[#111111] px-4 pt-6 md:px-4 md:pt-6">
            <h1 className="text-3xl font-bold">Builder</h1>
            <div className="flex gap-2">
              {isExistingForm ? (
                <CopyButton
                  className="h-8"
                  value={`${siteConfig.url}/forms/${currentFormId}`}
                />
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="h-8 cursor-pointer"
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

          <Card
            className={cn(
              'mb-1 flex h-[calc(100vh-72px)] flex-col gap-0 overflow-hidden rounded-none border-none bg-card text-card-foreground !p-0',
            )}
          >
            <ChromeTabStrip
              pages={formStructure.pages}
              activePageId={resolvedActivePageId}
              onSelectPage={selectPage}
              onRemovePage={removePageById}
              onAddPage={addPage}
              canRemovePage={formStructure.pages.length > 1}
            />
            <CardContent
              className={cn(
                'min-h-0 flex-1 overflow-y-auto p-3 md:p-4',
                !hasCanvasSections && 'flex h-full w-full items-center justify-center',
              )}
            >
              <AnimatePresence
                mode="popLayout"
                custom={pageTransitionDirection.current}
              >
                <motion.div
                  key={resolvedActivePageId}
                  custom={pageTransitionDirection.current}
                  className={cn('w-full', !hasCanvasSections && 'h-full')}
                  variants={pageTransitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.15 }
                      : {
                          type: 'spring',
                          stiffness: 400,
                          damping: 35,
                          mass: 0.8,
                        }
                  }
                >
                  <BuilderCanvas
                    activePage={activePage}
                    hasSections={hasCanvasSections}
                    onCanvasRef={registerCanvas}
                    onEditSection={(section) =>
                      setEditingSection({
                        pageId: resolvedActivePageId,
                        section,
                      })
                    }
                    onEditField={(field, sectionId) =>
                      setEditingField({
                        field,
                        pageId: resolvedActivePageId,
                        sectionId,
                      })
                    }
                    onFieldSurfaceRef={registerFieldSurface}
                    onRemoveSection={removeSectionById}
                    onRemoveField={removeFieldById}
                    paletteFieldPlaceholderId={paletteFieldPlaceholderId}
                    paletteSectionPlaceholderId={paletteSectionPlaceholderId}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </ScrollArea>

        <BuilderPalette
          onAddField={addField}
          onAddSection={addSection}
        />
      </div>

      <BuilderDragOverlay
        activePage={activePage}
        canvasWidth={canvasWidth}
        fieldOverlayWidth={fieldOverlayWidth}
        paletteFieldRef={paletteFieldClone}
        paletteSectionRef={paletteSectionClone}
      />

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

      {editingSection ? (
        <SectionEditor
          section={editingSection.section}
          onUpdate={(section) => {
            setFormStructure((prev) =>
              updateSection(prev, editingSection.pageId, section),
            )
            setEditingSection(null)
          }}
          onClose={() => setEditingSection(null)}
        />
      ) : null}
    </DragDropProvider>
  )
}
