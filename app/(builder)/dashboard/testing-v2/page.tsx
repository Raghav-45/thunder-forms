'use client'

import { CollisionPriority } from '@dnd-kit/abstract'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  DragDropEventHandlers,
  DragDropProvider,
  DragOverlay,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  AlignLeftIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  TextIcon,
  ToggleLeftIcon,
  TypeIcon,
} from 'lucide-react'
import { memo, useCallback, useMemo, useRef, useState } from 'react'

import { FieldConfig } from '@/components/FormBuilder/elements'
import type { FieldProps } from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'toggle'
  | 'date'
  | 'rating'
  | 'heading'

interface Field {
  id: string
  type: FieldType
  label: string
  placeholder?: string
}

interface Section {
  id: string
  title: string
  fields: Field[]
}

// ─── Field metadata ───────────────────────────────────────────────────────────

const FIELD_META: Record<
  FieldType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  text: { icon: TypeIcon, color: '#7193f1', bg: 'rgba(113,147,241,0.1)' },
  email: { icon: MailIcon, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  phone: { icon: PhoneIcon, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  textarea: {
    icon: AlignLeftIcon,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
  },
  select: {
    icon: ChevronDownIcon,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
  },
  checkbox: {
    icon: CheckSquareIcon,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.1)',
  },
  toggle: {
    icon: ToggleLeftIcon,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
  },
  date: { icon: CalendarIcon, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  rating: { icon: StarIcon, color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  heading: { icon: TextIcon, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

// ─── Mapping to real FormBuilder elements ─────────────────────────────────────

const TYPE_TO_REGISTRY: Record<
  FieldType,
  {
    identifier: FieldConfig['uniqueIdentifier']
    extra?: Record<string, unknown>
  }
> = {
  text: { identifier: 'text-input' },
  email: { identifier: 'text-input', extra: { inputType: 'email' } },
  phone: { identifier: 'text-input', extra: { inputType: 'tel' } },
  textarea: { identifier: 'text-area' },
  select: { identifier: 'single-select' },
  checkbox: { identifier: 'checkbox' },
  toggle: { identifier: 'switch-field' },
  date: { identifier: 'date-picker' },
  rating: {
    identifier: 'slider',
    extra: { min: 0, max: 5, step: 1, showValue: true },
  },
  heading: { identifier: 'section-header' },
}

function buildFieldConfig(field: Field): FieldConfig {
  const { identifier, extra } = TYPE_TO_REGISTRY[field.type]
  const base = createDefaultFieldConfig(identifier)
  return {
    ...base,
    id: field.id,
    label: field.label,
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...extra,
  } as FieldConfig
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_SECTIONS: Section[] = [
  {
    id: 'section-personal',
    title: 'Personal Info',
    fields: [
      { id: 'f-heading-1', type: 'heading', label: 'Your Details' },
      {
        id: 'f-name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
      },
      {
        id: 'f-email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'john@example.com',
      },
      {
        id: 'f-phone',
        type: 'phone',
        label: 'Phone Number',
        placeholder: '+1 (555) 000-0000',
      },
    ],
  },
  {
    id: 'section-details',
    title: 'Additional Details',
    fields: [
      { id: 'f-dob', type: 'date', label: 'Date of Birth' },
      {
        id: 'f-country',
        type: 'select',
        label: 'Country',
        placeholder: 'Select a country',
      },
      {
        id: 'f-bio',
        type: 'textarea',
        label: 'Short Bio',
        placeholder: 'Tell us about yourself...',
      },
    ],
  },
  {
    id: 'section-prefs',
    title: 'Preferences',
    fields: [
      { id: 'f-newsletter', type: 'toggle', label: 'Subscribe to newsletter' },
      {
        id: 'f-terms',
        type: 'checkbox',
        label: 'I agree to the Terms & Conditions',
      },
      { id: 'f-rating', type: 'rating', label: 'How did you hear about us?' },
    ],
  },
]

// ─── Sensors ──────────────────────────────────────────────────────────────────

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      return [source.element, source.handle]
    },
  }),
  KeyboardSensor,
]

// ─── FieldCard ────────────────────────────────────────────────────────────────

interface FieldCardProps {
  field: Field
  sectionId: string
  index: number
  value: unknown
  onChange: (value: unknown) => void
  isDragOverlay?: boolean
}

const FieldCard = memo(function FieldCard({
  field,
  sectionId,
  index,
  value,
  onChange,
  isDragOverlay,
}: FieldCardProps) {
  const { handleRef, ref, isDragSource } = useSortable({
    id: field.id,
    group: sectionId,
    accept: 'field',
    type: 'field',
    index,
    data: { sectionId },
  })

  const meta = FIELD_META[field.type]
  const config = useMemo(() => buildFieldConfig(field), [field])
  const Component = getFieldComponent(
    config.uniqueIdentifier,
  ) as unknown as React.ComponentType<FieldProps>

  return (
    <div
      ref={isDragOverlay ? undefined : (ref as any)}
      className={`rounded-lg border border-neutral-800 bg-neutral-950 p-3 flex items-center gap-3 transition-opacity ${
        !isDragOverlay && isDragSource ? 'opacity-30' : ''
      } ${isDragOverlay ? 'shadow-2xl cursor-grabbing' : ''}`}
      style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
    >
      {/* Real FormBuilder field element */}
      <div className="flex-1 min-w-0">
        <Component
          field={config as FieldProps['field']}
          value={value}
          onChange={onChange}
        />
      </div>

      {/* Drag handle */}
      {!isDragOverlay && (
        <button
          ref={handleRef as any}
          className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-300 transition-colors shrink-0"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
    </div>
  )
})

// ─── SortableSection ─────────────────────────────────────────────────────────

interface SortableSectionProps {
  section: Section
  index: number
  values: Record<string, unknown>
  onFieldChange: (id: string, value: unknown) => void
  isDragOverlay?: boolean
}

const SortableSection = memo(function SortableSection({
  section,
  index,
  values,
  onFieldChange,
  isDragOverlay,
}: SortableSectionProps) {
  const { handleRef, isDragSource, ref } = useSortable({
    id: section.id,
    accept: ['section', 'field'],
    collisionPriority: CollisionPriority.Low,
    type: 'section',
    index,
  })

  return (
    <div
      ref={isDragOverlay ? undefined : (ref as any)}
      className={`rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3 transition-opacity ${
        !isDragOverlay && isDragSource ? 'opacity-30' : ''
      } ${isDragOverlay ? 'shadow-2xl cursor-grabbing' : ''}`}
    >
      {/* Section header / drag handle */}
      <div
        ref={isDragOverlay ? undefined : (handleRef as any)}
        className={`flex items-center gap-2 pb-1 border-b border-neutral-800 ${
          isDragOverlay ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <GripVerticalIcon className="size-4 text-neutral-600" />
        <span className="text-sm font-semibold text-neutral-300">
          {section.title}
        </span>
        <span className="ml-auto text-xs text-neutral-600">
          {section.fields.length} fields
        </span>
      </div>

      {/* Fields */}
      {section.fields.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-lg h-20 flex items-center justify-center text-xs text-neutral-600">
          No fields yet
        </div>
      ) : (
        <div className="space-y-2">
          {section.fields.map((field, fi) => (
            <FieldCard
              key={field.id}
              field={field}
              sectionId={section.id}
              index={fi}
              value={values[field.id]}
              onChange={(value) => onFieldChange(field.id, value)}
              isDragOverlay={isDragOverlay}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// ─── App ──────────────────────────────────────────────────────────────────────

// Flatten sections → move-compatible shape: Record<sectionId, fieldId[]>
function sectionsToMap(sections: Section[]): Record<string, string[]> {
  return Object.fromEntries(
    sections.map((s) => [s.id, s.fields.map((f) => f.id)]),
  )
}

// Rebuild sections from a reordered map + field lookup
function mapToSections(
  map: Record<string, string[]>,
  columnOrder: string[],
  fieldLookup: Record<string, Field>,
  sectionLookup: Record<string, Section>,
): Section[] {
  return columnOrder.map((sectionId) => ({
    ...sectionLookup[sectionId],
    fields: (map[sectionId] ?? []).map((fid) => fieldLookup[fid]),
  }))
}

export default function App() {
  const [sections, setSections] = useState(INITIAL_SECTIONS)
  const [sectionOrder] = useState(() => INITIAL_SECTIONS.map((s) => s.id))
  const [values, setValues] = useState<Record<string, unknown>>({})
  const snapshot = useRef(structuredClone(sections))

  // Lookup maps (stable refs derived from state)
  const fieldLookup: Record<string, Field> = {}
  const sectionLookup: Record<string, Section> = {}
  for (const s of sections) {
    sectionLookup[s.id] = s
    for (const f of s.fields) fieldLookup[f.id] = f
  }

  const updateValue = useCallback((id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const applyMove = useCallback(
    (
      event: Parameters<NonNullable<DragDropEventHandlers['onDragOver']>>[0],
    ) => {
      setSections((prev) => {
        const lookup: Record<string, Field> = {}
        const sLookup: Record<string, Section> = {}
        for (const s of prev) {
          sLookup[s.id] = s
          for (const f of s.fields) lookup[f.id] = f
        }
        const map = sectionsToMap(prev)
        const order = prev.map((s) => s.id)

        // move() works on Record<string, string[]>
        const newMap = move(map, event as any)
        return mapToSections(newMap, order, lookup, sLookup)
      })
    },
    [],
  )

  // Find a field or section by id for the overlay
  const findField = (id: string) => fieldLookup[id]
  const findSection = (id: string) => sections.find((s) => s.id === id)

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={useCallback<DragDropEventHandlers['onDragStart']>(() => {
        snapshot.current = structuredClone(sections)
      }, [sections])}
      onDragOver={useCallback<DragDropEventHandlers['onDragOver']>(
        (event) => {
          if (event.operation.source?.type === 'section') return
          applyMove(event)
        },
        [applyMove],
      )}
      onDragEnd={useCallback<DragDropEventHandlers['onDragEnd']>(
        (event) => {
          if (event.canceled) {
            setSections(snapshot.current)
            return
          }
          if (event.operation.source?.type === 'section') {
            applyMove(event as any)
          }
        },
        [applyMove],
      )}
    >
      <div className="p-8 max-w-2xl mx-auto min-h-screen bg-neutral-950 text-white font-sans">
        <h1 className="text-3xl font-bold mb-2">Form Builder</h1>
        <p className="text-neutral-500 text-sm mb-8">
          Drag sections and fields to reorder them.
        </p>

        <div className="space-y-4 pb-16">
          {sections.map((section, si) => (
            <SortableSection
              key={section.id}
              section={section}
              index={si}
              values={values}
              onFieldChange={updateValue}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {(source) => {
          if (source.type === 'section') {
            const section = findSection(String(source.id))
            if (!section) return null
            return (
              <SortableSection
                section={section}
                index={0}
                values={values}
                onFieldChange={updateValue}
                isDragOverlay
              />
            )
          }
          if (source.type === 'field') {
            const field = findField(String(source.id))
            if (!field) return null
            return (
              <FieldCard
                field={field}
                sectionId=""
                index={0}
                value={values[field.id]}
                onChange={() => {}}
                isDragOverlay
              />
            )
          }
          return null
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}
