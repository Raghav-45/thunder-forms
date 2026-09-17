import {
  type FieldConfig,
} from '@/features/form-builder/elements'

export interface FormSection {
  id: string
  fields: FieldConfig[]
}

export interface FormPage {
  id: string
  sections: FormSection[]
}

export interface FormStructure {
  pages: FormPage[]
}

export type FormStructureIdFactory = () => string

type UnknownRecord = Record<string, unknown>

// This validator runs in API routes as well as client components. Keep its
// runtime dependencies server-safe; importing the client field registry here
// makes valid fields appear unknown to the server bundle.
const KNOWN_FIELD_IDENTIFIERS = new Set<string>([
  'text-input',
  'multi-select',
  'text-area',
  'switch-field',
  'date-picker',
  'checkbox',
  'number-input',
  'single-select',
  'radio-group',
  'slider',
  'datetime-picker',
])

const createId = () => crypto.randomUUID()

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

const hasId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isKnownField = (value: unknown): value is FieldConfig => {
  if (!isRecord(value) || !hasId(value.id) || !hasId(value.uniqueIdentifier)) {
    return false
  }

  return KNOWN_FIELD_IDENTIFIERS.has(value.uniqueIdentifier)
}

export function isKnownFieldIdentifier(value: unknown): boolean {
  return typeof value === 'string' && KNOWN_FIELD_IDENTIFIERS.has(value)
}

const hasUniqueId = (ids: Set<string>, id: string): boolean => {
  if (ids.has(id)) return false

  ids.add(id)
  return true
}

export function createFormSection(
  fields: FieldConfig[] = [],
  idFactory: FormStructureIdFactory = createId,
): FormSection {
  return { id: idFactory(), fields }
}

export function createFormPage(
  sections: FormSection[] = [],
  idFactory: FormStructureIdFactory = createId,
): FormPage {
  return { id: idFactory(), sections }
}

export function createFormStructure(
  fields: FieldConfig[] = [],
  idFactory: FormStructureIdFactory = createId,
): FormStructure {
  return {
    pages: [createFormPage([createFormSection(fields, idFactory)], idFactory)],
  }
}

export function isFormStructure(value: unknown): value is FormStructure {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pages) ||
    value.pages.length === 0
  ) {
    return false
  }

  const ids = new Set<string>()

  return value.pages.every((page) => {
    if (
      !isRecord(page) ||
      !hasId(page.id) ||
      !hasUniqueId(ids, page.id) ||
      !Array.isArray(page.sections)
    ) {
      return false
    }

    return page.sections.every((section) => {
      if (
        !isRecord(section) ||
        !hasId(section.id) ||
        !hasUniqueId(ids, section.id) ||
        !Array.isArray(section.fields)
      ) {
        return false
      }

      return section.fields.every(
        (field) => isKnownField(field) && hasUniqueId(ids, field.id),
      )
    })
  })
}

export function getOrderedFormFields(
  structure: FormStructure,
): FieldConfig[] {
  return structure.pages.flatMap((page) =>
    page.sections.flatMap((section) => section.fields),
  )
}

/**
 * Sanitize externally produced fields (AI generation, Google import) before
 * they enter builder state. Drops unknown field types and repairs missing or
 * duplicate ids so the result always passes `isFormStructure` id rules.
 */
export function sanitizeImportedFields(value: unknown): FieldConfig[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const clean: FieldConfig[] = []

  for (const entry of value) {
    if (!isRecord(entry) || !isKnownFieldIdentifier(entry.uniqueIdentifier)) {
      continue
    }
    const field = entry as unknown as FieldConfig
    if (!hasId(field.id) || seen.has(field.id)) {
      field.id = `imported_${createId()}`
    }
    seen.add(field.id)
    clean.push(field)
  }

  return clean
}
