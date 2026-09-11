import {
  FIELD_REGISTRY,
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

const createId = () => crypto.randomUUID()

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

const hasId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isKnownField = (value: unknown): value is FieldConfig => {
  if (!isRecord(value) || !hasId(value.id) || !hasId(value.uniqueIdentifier)) {
    return false
  }

  return Object.hasOwn(FIELD_REGISTRY, value.uniqueIdentifier)
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
  if (!isRecord(value) || !Array.isArray(value.pages)) return false

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
