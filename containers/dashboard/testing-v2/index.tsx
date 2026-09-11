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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CollisionPriority, type DragOperation } from '@dnd-kit/abstract'
import {
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  DragDropEventHandlers,
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { GripVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { forwardRef, memo, use, useCallback, useRef, useState } from 'react'

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
    activationConstraints(event, source) {
      // Sidebar dock presets grab instantly (distance-only) so the pick-up
      // feels snappy; canvas items/sections keep the default delay+distance.
      if (source.type === 'field') {
        return [new PointerActivationConstraints.Distance({ value: 5 })]
      }
      const fallback = PointerSensor.defaults.activationConstraints
      if (typeof fallback === 'function') return fallback(event, source)
      return [
        new PointerActivationConstraints.Delay({ value: 200, tolerance: 10 }),
        new PointerActivationConstraints.Distance({ value: 5 }),
      ]
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
    accept: ['item', 'field'],
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
    accept: ['section', 'item', 'field'],
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

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

interface Section {
  id: string
  fields: FieldConfig[]
}

interface Page {
  id: string
  sections: Section[]
}

interface IFormStructure {
  pages: Page[]
}

const generateNewSection = (): Section => ({
  id: crypto.randomUUID(),
  fields: [],
})

const generateNewPage = (): Page => ({
  id: crypto.randomUUID(),
  sections: [],
})

/**
 * Removes `field` from wherever it currently lives, then inserts it into
 * `sectionId` at `index`. Used to live-preview a sidebar preset being
 * dragged across the grid (remove + re-insert on every dragover) so the
 * source dock -> canvas move feels like the dnd-kit multiple-lists story.
 */
function upsertFieldInSections(
  sections: Section[],
  field: FieldConfig,
  sectionId: string,
  index: number,
): Section[] {
  const record = Object.fromEntries(
    sections.map((s) => [s.id, s.fields.filter((f) => f.id !== field.id)]),
  )
  const target = record[sectionId]
  if (!target) return sections
  const clamped = Math.max(0, Math.min(index, target.length))
  record[sectionId] = [
    ...target.slice(0, clamped),
    field,
    ...target.slice(clamped),
  ]
  return sections.map((s) => ({ ...s, fields: record[s.id] }))
}

const createSectionWithField = (field: FieldConfig): Section => ({
  ...generateNewSection(),
  fields: [field],
})

const isPointInRect = (
  point: { x: number; y: number } | undefined,
  el: Element,
) => {
  if (!point) return false
  const r = el.getBoundingClientRect()
  return (
    point.x >= r.left &&
    point.x <= r.right &&
    point.y >= r.top &&
    point.y <= r.bottom
  )
}

type FieldDropTarget =
  | { kind: 'empty' }
  | { kind: 'insert'; sectionId: string; index: number }
  | null

/**
 * Interprets the drag operation during a sidebar 'field' drag to compute
 * where the new field should be inserted. `null` means the pointer is not
 * over a canvas drop zone (e.g. still over the dock).
 */
function resolveFieldTarget(operation: DragOperation): FieldDropTarget {
  const { source, target } = operation
  if (source?.type !== 'field' || !target) return null

  // The dock itself accepts 'field' drops (for within-list sorting), but that
  // never counts as a canvas target.
  if (target.type === 'field') return null

  const position = operation.position?.current
  const isBelow =
    !!target.shape && !!position && position.y > target.shape.center.y

  if (target.type === 'empty-canvas') {
    return { kind: 'empty' }
  }

  if (target.type === 'section') {
    return {
      kind: 'insert',
      sectionId: String(target.id),
      // Clamped by upsertFieldInSections; MAX_SAFE_INTEGER means "append".
      index: isBelow ? Number.MAX_SAFE_INTEGER : 0,
    }
  }

  if (isSortable(target as never)) {
    const sortableTarget = target as unknown as {
      data?: { group?: unknown }
      sortable?: { group?: unknown; index?: number }
    }
    const sectionId = sortableTarget.sortable?.group ?? sortableTarget.data?.group
    if (sectionId == null) return null
    return {
      kind: 'insert',
      sectionId: String(sectionId),
      index: +(sortableTarget.sortable?.index ?? 0) + (isBelow ? 1 : 0),
    }
  }

  return null
}

interface SidebarFieldPresetProps {
  fieldType: avaliableFieldsType
  onAdd: () => void
}

// A sidebar preset is the dock's source: a plain draggable (type 'field').
// Dragging one out carries it toward the canvas; the button remains in the
// dock (the caller will handle auto-refilling later).
function SidebarFieldPreset({ fieldType, onAdd }: SidebarFieldPresetProps) {
  const { ref, isDragging } = useDraggable({
    id: `preset-${fieldType}`,
    type: 'field',
    data: { fieldType },
  })

  return (
    <Button
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      variant="outline"
      size="sm"
      className={cn(
        'rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab',
        isDragging && 'opacity-30',
      )}
      onClick={onAdd}
    >
      <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
        {fieldType}
      </div>
      <div className="ml-auto flex flex-row">
        <GripVerticalIcon className="size-4" />
      </div>
    </Button>
  )
}

// Shown only when the canvas is completely empty (no sections). Being a
// droppable means a sidebar preset can be dropped onto an empty canvas —
// which snap-creates the first section with that field inside.
function EmptyCanvasDroppable() {
  const { ref, isDropTarget } = useDroppable({
    id: 'empty-canvas',
    type: 'empty-canvas',
    accept: 'field',
  })

  return (
    <div
      ref={ref as never}
      className={cn(
        'flex justify-center items-center w-full h-full text-muted-foreground text-center border-2 border-dashed rounded-lg transition-colors',
        isDropTarget && 'border-primary/60 bg-primary/5',
      )}
    >
      <p>Drag elements here to build your form or Generate with AI</p>
    </div>
  )
}

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { slug: paramFormId } = use(params)
  const [formStructure, setFormStructure] = useState<IFormStructure>(() => ({
    pages: [generateNewPage()],
  }))

  const snapshot = useRef(structuredClone(formStructure))

  // Whether onDragStart ran for the *current* drag operation. Keeps a
  // canceled dragEnd from restoring a stale snapshot captured before the
  // drag actually began (which would wipe out recently added sections).
  const dragStartedRef = useRef(false)

  // Tracks a sidebar preset being dragged over the grid. `config` is the
  // field created once at drag start; `sectionId` is where it currently
  // lives while being live-previewed (null = not inserted yet).
  const pendingFieldRef = useRef<{
    config: FieldConfig
    sectionId: string | null
  } | null>(null)

  // Width (px) that the DragOverlay clone should render at. Measured from
  // the canvas at drag start so the floating card matches the canvas width
  // instead of shrinking to its content (which made it look like a sidebar
  // preset).
  const overlayWidthRef = useRef<number | null>(null)
  const canvasContentRef = useRef<HTMLDivElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)

  // Whether the drag pointer is currently over the canvas column. The
  // floating clone stays compact (dock-preset size, pivoted on its right
  // edge) while over the dock and only expands once over a canvas drop zone.
  const [isOverCanvas, setIsOverCanvas] = useState(false)

  // Width of the column that sections/fields render at inside the canvas.
  const measureCanvasWidth = () => {
    if (canvasContentRef.current) return canvasContentRef.current.clientWidth
    const el = canvasContainerRef.current
    if (!el) return null
    const cs = getComputedStyle(el)
    return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
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

  const removeFieldFromAllSections = useCallback((fieldId: string) => {
    setFormStructure((prev) => ({
      ...prev,
      pages: prev.pages.map((page, i) =>
        i === 0
          ? {
              ...page,
              sections: page.sections.map((s) => ({
                ...s,
                fields: s.fields.filter((f) => f.id !== fieldId),
              })),
            }
          : page,
      ),
    }))
  }, [])

  const handleDragStart = useCallback<
    DragDropEventHandlers['onDragStart']
  >((event) => {
    const { source } = event.operation
    snapshot.current = structuredClone(formStructure)
    pendingFieldRef.current = null
    dragStartedRef.current = true

    // Created once per drag so the live preview shows a field identical
    // to what will actually be added on drop.
    if (source?.type === 'field') {
      const fieldType = source.data?.fieldType
      if (typeof fieldType === 'string' && fieldType.length > 0) {
        pendingFieldRef.current = {
          config: createDefaultFieldConfig(fieldType as avaliableFieldsType),
          sectionId: null,
        }
      }
    }

    // Size the overlay clone to the canvas width where it will land.
    const sourceElement = source?.element
    const sourceWidth =
      sourceElement instanceof HTMLElement
        ? sourceElement.getBoundingClientRect().width
        : null
    overlayWidthRef.current = measureCanvasWidth() ?? sourceWidth

    const canvasEl = canvasContainerRef.current
    setIsOverCanvas(
      canvasEl != null &&
        isPointInRect(
          event.operation.position?.current as { x: number; y: number },
          canvasEl,
        ),
    )
  }, [formStructure])

  const handleDragOver = useCallback<DragDropEventHandlers['onDragOver']>(
    (event) => {
      const { source, target } = event.operation

      // Expanded/compact overlay mode. A dock preset never counts as being
      // "over the canvas" (it's the other list in the multi-list setup).
      const over = target != null && target.type !== 'field'
      setIsOverCanvas((prev) => (prev === over ? prev : over))

      if (!source) return

      if (source.type === 'field') {
        const pending = pendingFieldRef.current
        if (!pending) return

        const resolved = resolveFieldTarget(event.operation)

        // Over the empty canvas: snap-create the first section (if needed).
        if (resolved?.kind === 'empty') {
          if (formStructure.pages[0].sections.length === 0) {
            const section = createSectionWithField(pending.config)
            pending.sectionId = section.id
            setFormStructure((prev) =>
              prev.pages[0].sections.length > 0
                ? prev
                : {
                    ...prev,
                    pages: [{ ...prev.pages[0], sections: [section] }],
                  },
            )
          }
          return
        }

        // Still over the dock / no canvas target: fold the preview back out.
        if (!resolved) {
          if (pending.sectionId) {
            pending.sectionId = null
            removeFieldFromAllSections(pending.config.id)
          }
          return
        }

        pending.sectionId = resolved.sectionId
        setFormStructure((prev) => ({
          ...prev,
          pages: prev.pages.map((page, i) =>
            i === 0
              ? {
                  ...page,
                  sections: upsertFieldInSections(
                    page.sections,
                    pending.config,
                    resolved.sectionId,
                    resolved.index,
                  ),
                }
              : page,
          ),
        }))
        return
      }

      if (source.type === 'section') {
        return
      }

      // Item reorder within the canvas.
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
    [formStructure, removeFieldFromAllSections],
  )

  const handleDragEnd = useCallback<DragDropEventHandlers['onDragEnd']>(
    (event) => {
      const { source, canceled } = event.operation
      const started = dragStartedRef.current
      dragStartedRef.current = false
      const pending = pendingFieldRef.current
      pendingFieldRef.current = null

      if (source?.type === 'field') {
        if (!pending) return

        // The live dragover already placed (or un-placed) the field at its
        // final position as the pointer moved. Dropping is therefore a no-op;
        // only a cancelled drag needs an explicit undo.
        if (canceled) {
          removeFieldFromAllSections(pending.config.id)
        }
        return
      }

      if (canceled && started) {
        setFormStructure(snapshot.current)
      }
    },
    [removeFieldFromAllSections],
  )

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

      <ScrollArea className="flex-1 p-4 md:p-4 pt-6 overflow-auto sticky">
        <div className="flex flex-row justify-between">
          <h2 className="mb-6 font-bold text-3xl">Builder</h2>

          {/* <div className="flex flex-row gap-x-2">
            {currentFormId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
            )}
          </div> */}
        </div>
        <Card
          className={cn(
            'h-[calc(100vh-100px)] overflow-y-scroll border-2 border-dashed !p-0 border-muted mb-1',
            sections.length === 0 && 'flex items-center justify-center',
          )}
        >
          <CardContent
            ref={canvasContainerRef}
            className={cn(
              'p-3 md:p-4',
              sections.length === 0 &&
                'flex items-center justify-center w-full h-full',
            )}
          >
            {sections.length === 0 ? (
              <EmptyCanvasDroppable />
            ) : (
              <div
                ref={canvasContentRef}
                className="mx-auto min-h-screen text-white font-sans"
              >
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
                  {(
                    AVAILABLE_FIELDS.concat(
                      comingSoonElements,
                    ) as avaliableFieldsType[]
                  ).map((fieldType) => {
                    if (!AVAILABLE_FIELDS.includes(fieldType)) {
                      return (
                        <Button
                          key={fieldType}
                          variant="outline"
                          className="rounded-lg w-full px-2 md:pl-3 bg-neutral-900! cursor-grab"
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
                      )
                    }
                    return (
                      <SidebarFieldPreset
                        key={fieldType}
                        fieldType={fieldType}
                        onAdd={() =>
                          handleAddFieldToLastSection(
                            fieldType as avaliableFieldsType,
                          )
                        }
                      />
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {/* {renderEditor()} */}
      </>
      </div>

      <DragOverlay>
        {(source: any) => {
          if (!source) return null

          // Compact (dock-size) until the pointer is over a canvas drop zone,
          // then expand to the canvas column width captured at drag start.
          const floatingWidth = isOverCanvas
            ? (overlayWidthRef.current ?? undefined)
            : undefined

          if (source.type === 'section') {
            const sectionIndex = sections.findIndex((s) => s.id === source.id)
            const section = sections[sectionIndex]
            if (!section) return null
            const accentColor =
              ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length]

            return (
              <div style={{ width: floatingWidth }}>
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
              </div>
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
              <div style={{ width: floatingWidth }}>
                <ItemCard
                  id={field.id}
                  label={field.uniqueIdentifier}
                  field={field}
                  accentColor={accentColor}
                  state="floating"
                />
              </div>
            )
          }

          if (source.type === 'field') {
            const config =
              pendingFieldRef.current?.config ??
              createDefaultFieldConfig(
                String(source.data?.fieldType ?? '') as avaliableFieldsType,
              )
            // Right-pivoted so the clone extends toward the canvas from the
            // dock, and doesn't flip sides when it expands on canvas entry.
            return (
              <div
                style={{
                  width: floatingWidth,
                  transform: 'translateX(-100%)',
                }}
              >
                <ItemCard
                  id={config.id}
                  label={config.uniqueIdentifier}
                  field={config}
                  accentColor="#7193f1"
                  state="floating"
                />
              </div>
            )
          }

          return null
        }}
      </DragOverlay>
    </DragDropProvider>

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
