'use client'

import { FieldConfig } from '@/features/form-builder/elements'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/features/form-builder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/features/form-builder/utils/helperFunctions'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getTemplateBySlug } from '@/lib/form-templates'
import { instantiateTemplate } from '@/lib/instantiate-template'
import type { CreateFormPayload } from '@/lib/validators/form'
import { CollisionPriority } from '@dnd-kit/abstract'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  DragDropEventHandlers,
  DragDropProvider,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import axios from 'axios'
import {
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PropsWithChildren, ReactNode } from 'react'
import {
  Suspense,
  forwardRef,
  memo,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

// Section ids are now real UUIDs (not the old A/B/C/D demo keys), so
// colors are assigned by position instead of looked up by id.
const ACCENT_COLORS = [
  '#7193f1',
  '#FF851B',
  '#2ECC40',
  '#ff3680',
  '#a78bfa',
  '#22d3ee',
]

// ---------------------------------------------------------------------
// Presentational components. These know nothing about dnd-kit — they're
// just "what an item/section looks like." Used both by the live sortable
// tree (wrapped with drag behavior below) and by DragOverlay (rendered
// bare, as a static floating clone). One definition of the UI, two call
// sites — instead of the overlay hand-maintaining a visual copy.
// ---------------------------------------------------------------------

interface ItemCardProps {
  id: string
  label: string
  field: FieldConfig
  accentColor: string
  // 'ghost'    -> this is the item currently being dragged FROM (faded, still in place)
  // 'floating' -> this is the DragOverlay clone following the cursor
  state?: 'ghost' | 'floating'
  // Only passed by the live sortable wrapper. Its presence is what turns
  // the grip icon into an actual drag handle vs. a decorative icon.
  handleRef?: React.Ref<HTMLButtonElement>
}

const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(function ItemCard(
  { id, label, field, accentColor, state, handleRef },
  ref,
) {
  const FieldComponent = getFieldComponent(field.uniqueIdentifier)
  return (
    <div
      ref={ref}
      className={`group relative bg-card rounded-lg flex items-center justify-between border-2 border-dashed border-border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing ${
        state === 'ghost' ? 'opacity-30' : ''
      } ${state === 'floating' ? 'shadow-2xl cursor-grabbing' : ''}`}
    >
      <div className="flex-1 pr-2 pointer-events-none">
        <FieldComponent
          field={field as never}
          value={undefined}
          onChange={(value) => console.log(field.id, value)}
        />
      </div>
      {/* Action Buttons - Only visible on hover */}
      <div
        className={`absolute right-3 top-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          state === 'floating' ? 'hidden' : ''
        }`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="cursor-pointer h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary border border-border/50"
          // TODO: wire up field editing
          onClick={() => alert('Edit field functionality not implemented yet.')}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="cursor-pointer h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive border border-border/50"
          // TODO: wire up field removal
          onClick={() =>
            alert('Remove field functionality not implemented yet.')
          }
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

interface SectionCardProps {
  id: string
  isEmpty: boolean
  state?: 'ghost' | 'floating'
  // Only passed by the live sortable wrapper — same idea as ItemCard.
  handleRef?: React.Ref<HTMLDivElement>
  children?: ReactNode
}

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard({ id, isEmpty, state, handleRef, children }, ref) {
    return (
      <div
        ref={ref}
        className={`border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 transition-opacity ${
          state === 'ghost' ? 'opacity-30' : ''
        } ${state === 'floating' ? 'shadow-2xl cursor-grabbing' : ''}`}
      >
        <div
          ref={handleRef}
          className={`flex items-center gap-2 text-sm font-medium text-neutral-400 ${
            handleRef ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <GripVerticalIcon className="size-4" />
          <span>Section - [{id}]</span>
        </div>

        {isEmpty ? (
          <div className="border border-dashed border-neutral-800 rounded-lg h-24 flex items-center justify-center text-sm text-neutral-500">
            Drop fields here
          </div>
        ) : (
          <div className="space-y-3 flex-1">{children}</div>
        )}
      </div>
    )
  },
)

// ---------------------------------------------------------------------
// Sortable wrappers. Thin: call useSortable, forward its ref/handleRef
// into the presentational component above. No layout/styling lives here.
// ---------------------------------------------------------------------

interface SortableItemProps {
  id: string
  label: string
  field: FieldConfig
  column: string
  index: number
  accentColor: string
}

const SortableItem = memo(function SortableItem({
  id,
  label,
  field,
  column,
  index,
  accentColor,
}: PropsWithChildren<SortableItemProps>) {
  const group = column
  const { handleRef, ref, isDragging, isDragSource } = useSortable({
    id,
    group,
    accept: ['item', 'palette-field'],
    type: 'item',
    index,
    data: { group },
  })

  return (
    <ItemCard
      ref={ref as any}
      id={id}
      label={label}
      field={field}
      accentColor={accentColor}
      state={isDragSource ? 'ghost' : undefined}
      handleRef={handleRef as any}
    />
  )
})

interface SortableSectionProps {
  id: string
  index: number
  fields: FieldConfig[]
  accentColor: string
}

const SortableSection = memo(function SortableSection({
  fields,
  id,
  index,
  accentColor,
}: PropsWithChildren<SortableSectionProps>) {
  const { handleRef, isDragging, isDragSource, ref } = useSortable({
    id,
    accept: ['section', 'item', 'palette-field'],
    collisionPriority: CollisionPriority.Low,
    type: 'section',
    index,
  })

  return (
    <SectionCard
      ref={ref as any}
      id={id}
      isEmpty={fields.length === 0}
      state={isDragSource ? 'ghost' : undefined}
      handleRef={handleRef as any}
    >
      {fields.map((field, fieldIndex) => (
        <SortableItem
          key={field.id}
          id={field.id}
          label={field.uniqueIdentifier}
          field={field}
          column={id}
          index={fieldIndex}
          accentColor={accentColor}
        />
      ))}
    </SectionCard>
  )
})

// Sortable palette row (v6). Lives in the sidebar list (group 'palette');
// canvas sections/items accept its type so it can be dragged across lists.
// Whole row initiates the drag; a plain click still fires onAdd.
const PaletteFieldRow = memo(function PaletteFieldRow({
  id,
  fieldType,
  onAdd,
}: {
  id: string
  fieldType: avaliableFieldsType
  onAdd: (fieldType: avaliableFieldsType) => void
}) {
  const { ref, isDragSource } = useSortable({
    id,
    group: 'palette',
    // Source-only list: accept nothing back.
    accept: () => false,
    type: 'palette-field',
    index: PALETTE.findIndex((item) => item.id === id),
    data: { group: 'palette', fieldType },
  })

  return (
    <button
      ref={ref as any}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab',
        isDragSource && 'opacity-30',
      )}
      onClick={() => onAdd(fieldType)}
    >
      <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
        {fieldType}
      </div>
      <div className="ml-auto flex flex-row">
        <GripVerticalIcon className="size-4" />
      </div>
    </button>
  )
})

function EmptyCanvasDropZoneV6() {
  const { ref, isDropTarget } = useDroppable({
    id: 'v6-empty-canvas',
    type: 'canvas-empty',
    accept: 'palette-field',
    data: { kind: 'canvas-empty' },
  })

  return (
    <div
      ref={ref}
      className={cn(
        'flex justify-center items-center h-full min-h-80 rounded-xl border border-dashed text-muted-foreground text-center transition-colors',
        isDropTarget && 'border-primary bg-primary/10 text-primary',
      )}
    >
      <p>
        {isDropTarget
          ? 'Drop the field here'
          : 'Drag elements here to build your form or Generate with AI'}
      </p>
    </div>
  )
}

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface Section {
  id: string
  fields: FieldConfig[]
}

interface IFormStructure {
  pages: {
    sections: Section[]
  }[]
}

const generateNewSection = (): Section => ({
  id: crypto.randomUUID(),
  fields: [],
})

// ---------------------------------------------------------------------
// v6: second sortable list — the sidebar field palette.
// Same vertical-list sortable pattern as the canvas (per dnd-kit docs,
// multiple sortable lists are modeled with `group`), arranged
// horizontally next to the canvas. The palette is source-only: its rows
// accept nothing (`accept: () => false`), so nothing can be dropped back
// into it, and palette drags are handled manually (clone-on-hover) so the
// sidebar list itself never mutates.
// ---------------------------------------------------------------------

interface PaletteEntry {
  id: string
  fieldType: avaliableFieldsType
}

const PALETTE: PaletteEntry[] = AVAILABLE_FIELDS.map((fieldType, index) => ({
  id: `palette-${fieldType}-${index}`,
  fieldType: fieldType as avaliableFieldsType,
}))

const paletteFieldTypeOf = (id: string): avaliableFieldsType | null => {
  const entry = PALETTE.find((item) => item.id === String(id))
  return entry ? entry.fieldType : null
}

export default function TestingV6Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading builder...
        </div>
      }
    >
      <TestingV6Builder params={Promise.resolve({ slug: '' })} />
    </Suspense>
  )
}

function TestingV6Builder({ params }: FormBuilderProps) {
  const { slug: paramFormId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template')
  const [formStructure, setFormStructure] = useState<IFormStructure>({
    pages: [
      {
        // sections: [generateNewSection()],
        sections: [],
      },
    ],
  })
  const [templateTitle, setTemplateTitle] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load a built-in template (?template=slug) into the builder on mount.
  useEffect(() => {
    if (!templateSlug) return
    const template = getTemplateBySlug(templateSlug)
    if (!template) {
      toast.error('Template not found')
      return
    }
    setFormStructure(instantiateTemplate(template))
    setTemplateTitle(template.title)
    toast.success(`Loaded template: ${template.title}`)
  }, [templateSlug])

  async function handleSaveAsNewForm() {
    const totalFields = formStructure.pages.flatMap((page) =>
      page.sections.flatMap((section) => section.fields),
    ).length
    if (totalFields === 0) {
      toast.error('Add at least one field before saving')
      return
    }
    setIsSaving(true)
    try {
      const template = templateSlug ? getTemplateBySlug(templateSlug) : undefined
      const payload: CreateFormPayload = {
        title: templateTitle ?? 'Untitled form',
        description: templateTitle
          ? `Created from the ${templateTitle} template`
          : undefined,
        fields: formStructure,
        submitButtonText: template?.submitButtonText,
      }
      const { data } = await axios.post('/api/forms/new', payload)
      toast.success('Form created! Opening it in the builder...')
      router.push(`/dashboard/builder/${data.id}`)
    } catch {
      toast.error('Failed to save form')
    } finally {
      setIsSaving(false)
    }
  }

  const snapshot = useRef(structuredClone(formStructure))
  // v6: the clone currently staged in the canvas while a palette drag
  // hovers it. The palette list itself is never mutated.
  const paletteClone = useRef<FieldConfig | null>(null)

  // Insert (or reposition) the palette clone at the drop position
  // indicated by the current drag target. Same clone object is reused
  // across dragover events so the staged field never remounts.
  function placePaletteClone(
    prev: IFormStructure,
    fieldType: avaliableFieldsType,
    target: { id?: unknown; index?: unknown } | null,
    cloneOverride: FieldConfig | null = null,
  ): IFormStructure {
    const sections = prev.pages[0].sections
    let sectionId: string | null = null
    let insertIndex = 0
    let activeClone = cloneOverride ?? paletteClone.current
    const targetId = String(target?.id ?? '')
    const isEmptyCanvasTarget = targetId === 'v6-empty-canvas'

    if (target) {
      const sectionHit = sections.find((s) => s.id === targetId)
      if (sectionHit) {
        sectionId = sectionHit.id
        insertIndex = sectionHit.fields.length
      } else {
        for (const section of sections) {
          const fieldIndex = section.fields.findIndex(
            (f) => f.id === targetId,
          )
          if (fieldIndex !== -1) {
            sectionId = section.id
            insertIndex =
              typeof target.index === 'number' ? target.index : fieldIndex
            break
          }
        }
      }
    }

    // The empty-canvas droppable represents the first section while the
    // canvas has no fields yet. If an empty section already exists, use it;
    // otherwise the drop creates one below.
    if (isEmptyCanvasTarget && !sectionId && sections[0]) {
      sectionId = sections[0].id
      insertIndex = sections[0].fields.length
    }

    const withoutClone: IFormStructure = {
      ...prev,
      pages: prev.pages.map((page, i) =>
        i === 0
          ? {
              ...page,
              sections: page.sections.map((s) => ({
                ...s,
                fields: activeClone
                  ? s.fields.filter((f) => f.id !== activeClone!.id)
                  : s.fields,
              })),
            }
          : page,
      ),
    }

    if (!sectionId && !isEmptyCanvasTarget) {
      // Hovering outside the canvas: stage nothing.
      return withoutClone
    }

    if (!activeClone) {
      const fresh = createDefaultFieldConfig(fieldType)
      fresh.id = `palette_${crypto.randomUUID().slice(0, 8)}`
      activeClone = fresh
      paletteClone.current = activeClone
    }

    if (!sectionId) {
      const newSection: Section = {
        ...generateNewSection(),
        fields: [activeClone],
      }

      return {
        ...withoutClone,
        pages: withoutClone.pages.map((page, i) =>
          i === 0 ? { ...page, sections: [newSection, ...page.sections] } : page,
        ),
      }
    }

    const section = withoutClone.pages[0].sections.find(
      (s) => s.id === sectionId,
    )
    const clampedIndex = Math.min(
      Math.max(insertIndex, 0),
      section ? section.fields.length : 0,
    )

    return {
      ...withoutClone,
      pages: withoutClone.pages.map((page, i) =>
        i === 0
          ? {
              ...page,
              sections: page.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      fields: [
                        ...s.fields.slice(0, clampedIndex),
                        activeClone,
                        ...s.fields.slice(clampedIndex),
                      ],
                    }
                  : s,
              ),
            }
          : page,
      ),
    }
  }

  function handleAddSection() {
    const newSection: Section = generateNewSection()

    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page, i) =>
        i === 0 ? { ...page, sections: [newSection, ...page.sections] } : page,
      ),
    }))
  }

  function handleAddFieldToLastSection(fieldType: avaliableFieldsType) {
    const newField = createDefaultFieldConfig(fieldType)

    setFormStructure((prev) => {
      const sections = prev.pages[0].sections
      if (sections.length === 0) {
        return {
          ...prev,
          pages: [
            {
              ...prev.pages[0],
              sections: [{ ...generateNewSection(), fields: [newField] }],
            },
          ],
        }
      }

      return {
        ...prev,
        pages: prev.pages.map((page, i) =>
          i === 0
            ? {
                ...page,
                sections: sections.map((s, si) =>
                  si === 0 ? { ...s, fields: [...s.fields, newField] } : s,
                ),
              }
            : page,
        ),
      }
    })
  }

  const sections = formStructure.pages[0].sections
  const hasCanvasFields = sections.some((section) => section.fields.length > 0)

  const handleDragStart = useCallback<
    DragDropEventHandlers['onDragStart']
  >(
    (event) => {
      snapshot.current = structuredClone(formStructure)

      const { source } = event.operation
      if (source?.type !== 'palette-field') return

      const fieldType =
        (
          source as unknown as {
            data?: { fieldType?: avaliableFieldsType }
          }
        ).data?.fieldType ?? paletteFieldTypeOf(String(source.id))
      if (!fieldType) return

      const clone = createDefaultFieldConfig(fieldType)
      clone.id = `palette_${crypto.randomUUID().slice(0, 8)}`
      paletteClone.current = clone
    },
    [formStructure],
  )

  const handleDragOver = useCallback<DragDropEventHandlers['onDragOver']>(
    (event) => {
      const { source, target } = event.operation

      if (source && source.type === 'section') {
        return
      }

      // v6: palette drags skip dnd-kit's optimistic sorting (per docs,
      // preventDefault in dragover opts a single event out) — we stage a
      // clone manually so the sidebar list never mutates.
      if (source && source.type === 'palette-field') {
        event.preventDefault()
        const fieldType =
          (
            source as unknown as {
              data?: { fieldType?: avaliableFieldsType }
            }
          ).data?.fieldType ?? paletteFieldTypeOf(String(source.id))
        if (!fieldType) return
        const activeClone = paletteClone.current
        setFormStructure((prev) =>
          placePaletteClone(
            prev,
            fieldType,
            target as unknown as { id?: unknown; index?: unknown } | null,
            activeClone,
          ),
        )
        return
      }

      setFormStructure((prev) => {
        const currentSections = prev.pages[0].sections

        // `move` expects a Record<groupId, items[]>, so we project the
        // sections into that shape, run the move, then project it back.
        const record = Object.fromEntries(
          currentSections.map((s) => [s.id, s.fields]),
        )
        const updated = move(record, event)

        const newSections = currentSections.map((s) => ({
          ...s,
          fields: updated[s.id] ?? s.fields,
        }))

        return {
          ...prev,
          pages: prev.pages.map((page, i) =>
            i === 0 ? { ...page, sections: newSections } : page,
          ),
        }
      })
    },
    [],
  )

  const handleDragEnd = useCallback<DragDropEventHandlers['onDragEnd']>(
    (event) => {
      if (event.canceled) {
        setFormStructure(snapshot.current)
        paletteClone.current = null
        return
      }
      // v6: a completed palette drop keeps the staged clone where it
      // landed. Reset the ref so the next palette drag mints a fresh field.
      if (event.operation.source?.type === 'palette-field') {
        paletteClone.current = null
      }
    },
    [],
  )

  return (
    <div className="flex bg-background h-screen text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="hidden md:block border-0 border-r-2 rounded-none w-80 h-screen overflow-hidden">
        <CardContent className="flex flex-col space-y-4 p-4 py-0 h-full">
          <div className="flex flex-row justify-between mb-8">
            <h2 className="font-bold text-2xl">Settings</h2>
            {/* <Button
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
            </Button> */}
          </div>
          {/* <div className="items-center gap-1.5 grid w-full">
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
          <SettingsDialog /> */}

          <div className="flex-grow"></div>

          {/* <ImportGoogleForm
            onImported={(title, description, fields) => {
              setFormSettings({
                ...formSettings,
                title,
                description,
              })
              setFields(fields)
            }}
          /> */}

          {/* <GenerateWithAiPrompt
            onGeneratedFields={(title, description, fields) => {
              setFormSettings({
                ...formSettings,
                title,
                description,
              })
              setFields(fields)
            }}
          /> */}
        </CardContent>
      </Card>

      <DragDropProvider
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-w-0 flex-1">
      <ScrollArea className="flex-1 p-4 md:p-4 pt-6 overflow-auto sticky">
        <div className="flex flex-row justify-between">
          <h2 className="mb-6 font-bold text-3xl">Builder · v6</h2>

          <div className="flex flex-row gap-x-2">
            <Button
              size="sm"
              onClick={handleSaveAsNewForm}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              {isSaving ? 'Saving...' : 'Save as new form'}
            </Button>
          </div>
          {/* <div className="flex flex-row gap-x-2">
            {currentFormId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
            )}
          </div> */}
        </div>
        {templateTitle && (
          <p className="mb-4 text-sm text-muted-foreground">
            Started from the “{templateTitle}” template — customize the fields
            below, then hit “Save as new form”.
          </p>
        )}
        <Card
          className={cn(
            'h-[calc(100vh-100px)] overflow-y-scroll border-2 border-dashed !p-0 border-muted mb-1',
            !(sections.flatMap((s) => s.fields).length > 0) &&
              'flex items-center justify-center',
          )}
        >
          <CardContent
            className={cn(
              'p-3 md:p-4',
              !(sections.flatMap((s) => s.fields).length > 0) &&
                'flex items-center justify-center w-full h-full',
            )}
          >
            {!hasCanvasFields ? (
              <EmptyCanvasDropZoneV6 />
            ) : (
                <div className="mx-auto min-h-screen text-white font-sans">
                  <div className="space-y-4 pb-8">
                    {sections.map((section, sectionIndex) => (
                      <SortableSection
                        key={section.id}
                        id={section.id}
                        index={sectionIndex}
                        fields={section.fields}
                        accentColor={
                          ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]
                        }
                      />
                    ))}
                  </div>
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
                  <Button
                    variant="outline"
                    className="rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab"
                    size="sm"
                    onClick={() => handleAddSection()}
                  >
                    <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                      Add Section
                    </div>
                    <div className="ml-auto flex flex-row">
                      <GripVerticalIcon className="size-4" />
                    </div>
                  </Button>
                  <Separator className="my-2" />
                  {/* v6: second sortable list — drag a row onto the canvas,
                      or click it to append to the first section. */}
                  {PALETTE.map((entry) => (
                    <PaletteFieldRow
                      key={entry.id}
                      id={entry.id}
                      fieldType={entry.fieldType}
                      onAdd={handleAddFieldToLastSection}
                    />
                  ))}
                  <Separator className="my-2" />
                  {comingSoonElements.map((fieldType) => (
                    <Button
                      key={fieldType}
                      variant="outline"
                      className="rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-not-allowed opacity-60"
                      size="sm"
                      disabled
                    >
                      <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                        {fieldType}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold mx-1 px-1 bg-blue-400 text-black rounded-full py-0"
                      >
                        coming soon
                      </Badge>
                      <div className="ml-auto flex flex-row">
                        <GripVerticalIcon className="size-4" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {/* {renderEditor()} */}
      </>
        <DragOverlay>
          {(source: any) => {
            if (!source) return null

            if (source.type === 'section') {
              const sectionIndex = sections.findIndex(
                (s) => s.id === source.id,
              )
              const section = sections[sectionIndex]
              if (!section) return null
              const accentColor =
                ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

              return (
                <SectionCard
                  id={section.id}
                  isEmpty={section.fields.length === 0}
                  state="floating"
                >
                  {section.fields.map((field) => (
                    <ItemCard
                      key={field.id}
                      id={field.id}
                      label={field.uniqueIdentifier}
                      field={field}
                      accentColor={accentColor}
                    />
                  ))}
                </SectionCard>
              )
            }

            if (source.type === 'item') {
              const sectionIndex = sections.findIndex((s) =>
                s.fields.some((f) => f.id === source.id),
              )
              const field = sections[sectionIndex]?.fields.find(
                (f) => f.id === source.id,
              )
              if (!field) return null
              const accentColor =
                ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

              return (
                <ItemCard
                  id={field.id}
                  label={field.uniqueIdentifier}
                  field={field}
                  accentColor={accentColor}
                  state="floating"
                />
              )
            }

            if (source.type === 'palette-field') {
              const staged = paletteClone.current
              if (!staged) return null

              return (
                <ItemCard
                  id={staged.id}
                  label={staged.uniqueIdentifier}
                  field={staged}
                  accentColor="#7193f1"
                  state="floating"
                />
              )
            }

            return null
          }}
        </DragOverlay>
        </div>
      </DragDropProvider>
    </div>

    // <DragDropProvider
    //   sensors={sensors}
    //   onDragStart={useCallback<DragDropEventHandlers['onDragStart']>(() => {
    //     snapshot.current = structuredClone(formStructure)
    //   }, [formStructure])}
    //   onDragOver={useCallback<DragDropEventHandlers['onDragOver']>((event) => {
    //     const { source } = event.operation

    //     if (source && source.type === 'section') {
    //       return
    //     }

    //     setFormStructure((prev) => {
    //       const currentSections = prev.pages[0].sections

    //       // `move` expects a Record<groupId, items[]>, so we project the
    //       // sections into that shape, run the move, then project it back.
    //       const record = Object.fromEntries(
    //         currentSections.map((s) => [s.id, s.fields]),
    //       )
    //       const updated = move(record, event)

    //       const newSections = currentSections.map((s) => ({
    //         ...s,
    //         fields: updated[s.id] ?? s.fields,
    //       }))

    //       return {
    //         ...prev,
    //         pages: prev.pages.map((page, i) =>
    //           i === 0 ? { ...page, sections: newSections } : page,
    //         ),
    //       }
    //     })
    //   }, [])}
    //   onDragEnd={useCallback<DragDropEventHandlers['onDragEnd']>((event) => {
    //     if (event.canceled) {
    //       setFormStructure(snapshot.current)
    //       return
    //     }
    //   }, [])}
    // >
    //   <div className="p-8 max-w-5xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
    //     <h1 className="text-3xl font-bold mb-8">Drag & Drop Testing</h1>

    //     <div className="flex flex-row justify-between">
    //       <button onClick={() => handleAddSection()}>Add Section</button>
    //       <button onClick={() => handleAddFieldToLastSection()}>
    //         Add Field to Latest Section
    //       </button>
    //     </div>

    //     <div className="space-y-4 pb-8">
    //       {sections.map((section, sectionIndex) => (
    //         <SortableSection
    //           key={section.id}
    //           id={section.id}
    //           index={sectionIndex}
    //           fields={section.fields}
    //           accentColor={ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]}
    //         />
    //       ))}
    //     </div>
    //   </div>

    //   <DragOverlay>
    //     {(source: any) => {
    //       if (!source) return null

    //       if (source.type === 'section') {
    //         const sectionIndex = sections.findIndex((s) => s.id === source.id)
    //         const section = sections[sectionIndex]
    //         if (!section) return null
    //         const accentColor =
    //           ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

    //         return (
    //           <SectionCard
    //             id={section.id}
    //             isEmpty={section.fields.length === 0}
    //             state="floating"
    //           >
    //             {section.fields.map((field) => (
    //               <ItemCard
    //                 key={field.id}
    //                 id={field.id}
    //                 label={field.uniqueIdentifier}
    //                 field={field}
    //                 accentColor={accentColor}
    //               />
    //             ))}
    //           </SectionCard>
    //         )
    //       }

    //       if (source.type === 'item') {
    //         const sectionIndex = sections.findIndex((s) =>
    //           s.fields.some((f) => f.id === source.id),
    //         )
    //         const field = sections[sectionIndex]?.fields.find(
    //           (f) => f.id === source.id,
    //         )
    //         if (!field) return null
    //         const accentColor =
    //           ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

    //         return (
    //           <ItemCard
    //             id={field.id}
    //             label={field.uniqueIdentifier}
    //             field={field}
    //             accentColor={accentColor}
    //             state="floating"
    //           />
    //         )
    //       }

    //       return null
    //     }}
    //   </DragOverlay>
    // </DragDropProvider>
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
