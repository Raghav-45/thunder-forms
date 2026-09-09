'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'
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

// Interactive overlay row (v7). Pixel-identical to the static row beneath
// it. `lifted` hides it in place (opacity only — still mounted, still
// laid out) while its static twin shows through, so the sidebar appears
// untouched for the whole drag.
const OverlayPaletteRow = memo(function OverlayPaletteRow({
  id,
  fieldType,
  index,
  lifted,
  onAdd,
}: {
  id: string
  fieldType: avaliableFieldsType
  index: number
  lifted: boolean
  onAdd: (fieldType: avaliableFieldsType) => void
}) {
  const { ref } = useSortable({
    id,
    group: 'palette',
    // Source-only list: accept nothing back.
    accept: () => false,
    type: 'palette-field',
    index,
    data: { group: 'palette', fieldType },
  })

  return (
    <button
      ref={ref as any}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        paletteRowClassName,
        lifted && 'opacity-0',
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

function EmptyCanvasDropZoneV7() {
  const { ref, isDropTarget } = useDroppable({
    id: 'v7-empty-canvas',
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
// v7: static sidebar + interactive overlay (sidebar-smoothing).
//
// Two pixel-identical lists are stacked: the visible static list on the
// bottom (aria-hidden, pointer-events-none — it NEVER mutates) and the
// interactive sortable list on top (transparent, same markup, the actual
// drag source). When a drag starts, the lifted overlay row turns
// opacity-0 *in place* — no unmount, no layout shift — so the static
// twin shows through and the sidebar looks untouched. The "refill" is
// the row restoring at dragend, masked by the identical underlay, which
// is why the user can never see it. Opacity (unlike mount/unmount)
// triggers no layout work, hence the smoother experience.
//
// dnd-kit side follows the docs' multiple-lists-via-`group` pattern:
// overlay rows are group 'palette', type 'palette-field', source-only
// (`accept: () => false`); canvas sections/items accept that type and
// palette dragover events skip optimistic sorting (preventDefault) while
// we stage a clone manually.
// ---------------------------------------------------------------------

interface PaletteEntry {
  id: string
  fieldType: avaliableFieldsType
}

// Static underlay content — module-level so identity is forever stable.
const STATIC_PALETTE: PaletteEntry[] = AVAILABLE_FIELDS.map(
  (fieldType, index) => ({
    id: `static-palette-${fieldType}-${index}`,
    fieldType: fieldType as avaliableFieldsType,
  }),
)

// Interactive overlay content — same order, stable ids, never reordered.
const OVERLAY_PALETTE: PaletteEntry[] = AVAILABLE_FIELDS.map(
  (fieldType, index) => ({
    id: `overlay-palette-${fieldType}-${index}`,
    fieldType: fieldType as avaliableFieldsType,
  }),
)

const paletteRowClassName =
  'rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab'

const paletteFieldTypeOf = (id: string): avaliableFieldsType | null => {
  const entry = OVERLAY_PALETTE.find((item) => item.id === String(id))
  return entry ? entry.fieldType : null
}

export default function TestingV7Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading builder...
        </div>
      }
    >
      <TestingV7Builder params={Promise.resolve({ slug: '' })} />
    </Suspense>
  )
}

function TestingV7Builder({ params }: FormBuilderProps) {
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
  // v7: active palette drag — the clone staged in the canvas plus the id
  // of the lifted (opacity-0) overlay row. Neither palette list mutates.
  const paletteDrag = useRef<{ sourceId: string; clone: FieldConfig } | null>(
    null,
  )
  const [liftedPaletteId, setLiftedPaletteId] = useState<string | null>(null)

  // Insert (or reposition) the staged palette clone at the drop position
  // indicated by the current drag target. The same clone object is reused
  // across dragover events so the staged field never remounts.
  function positionPaletteClone(
    prev: IFormStructure,
    clone: FieldConfig,
    target: { id?: unknown; index?: unknown } | null,
  ): IFormStructure {
    const sections = prev.pages[0].sections
    let sectionId: string | null = null
    let insertIndex = 0
    const targetId = String(target?.id ?? '')
    const isEmptyCanvasTarget = targetId === 'v7-empty-canvas'

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
                fields: s.fields.filter((f) => f.id !== clone.id),
              })),
            }
          : page,
      ),
    }

    if (!sectionId && !isEmptyCanvasTarget) {
      // Hovering outside the canvas: stage nothing.
      return withoutClone
    }

    if (!sectionId) {
      const newSection: Section = {
        ...generateNewSection(),
        fields: [clone],
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
                        clone,
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

      // v7: palette drag begins — mint the canvas clone and lift the
      // overlay row in place. The static twin underneath shows through,
      // so the sidebar looks untouched from the very first frame.
      const { source } = event.operation
      if (source && source.type === 'palette-field') {
        const fieldType =
          (
            source as unknown as {
              data?: { fieldType?: avaliableFieldsType }
            }
          ).data?.fieldType ?? paletteFieldTypeOf(String(source.id))
        if (!fieldType) return
        const clone = createDefaultFieldConfig(fieldType)
        clone.id = `palette_${crypto.randomUUID().slice(0, 8)}`
        paletteDrag.current = { sourceId: String(source.id), clone }
        setLiftedPaletteId(String(source.id))
      }
    },
    [formStructure],
  )

  const handleDragOver = useCallback<DragDropEventHandlers['onDragOver']>(
    (event) => {
      const { source, target } = event.operation

      if (source && source.type === 'section') {
        return
      }

      // v7: palette drags skip dnd-kit's optimistic sorting (per docs,
      // preventDefault in dragover opts a single event out) — we stage the
      // dragstart-minted clone manually. Overlay + static lists untouched.
      if (source && source.type === 'palette-field') {
        event.preventDefault()
        if (!paletteDrag.current) return
        const active = paletteDrag.current
        setFormStructure((prev) =>
          positionPaletteClone(
            prev,
            active.clone,
            target as unknown as { id?: unknown; index?: unknown } | null,
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
        paletteDrag.current = null
        setLiftedPaletteId(null)
        return
      }
      // v7: a completed palette drop keeps the staged clone where it
      // landed. Restoring the lifted row IS the refill — masked by the
      // identical static twin, so the user never sees it happen.
      if (event.operation.source?.type === 'palette-field') {
        paletteDrag.current = null
        setLiftedPaletteId(null)
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
          <h2 className="mb-6 font-bold text-3xl">Builder · v7</h2>

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
              <EmptyCanvasDropZoneV7 />
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
                  {/* v7: static underlay (never moves, never re-renders) with
                      a pixel-identical interactive overlay on top — the
                      actual drag source. Drag a row onto the canvas, or
                      click it to append to the first section. */}
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none flex flex-col gap-y-2 select-none"
                    >
                      {STATIC_PALETTE.map((entry) => (
                        <Button
                          key={entry.id}
                          variant="outline"
                          className={paletteRowClassName}
                          size="sm"
                          tabIndex={-1}
                        >
                          <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                            {entry.fieldType}
                          </div>
                          <div className="ml-auto flex flex-row">
                            <GripVerticalIcon className="size-4" />
                          </div>
                        </Button>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex flex-col gap-y-2">
                      {OVERLAY_PALETTE.map((entry, index) => (
                        <OverlayPaletteRow
                          key={entry.id}
                          id={entry.id}
                          fieldType={entry.fieldType}
                          index={index}
                          lifted={liftedPaletteId === entry.id}
                          onAdd={handleAddFieldToLastSection}
                        />
                      ))}
                    </div>
                  </div>
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
              const staged = paletteDrag.current?.clone
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
