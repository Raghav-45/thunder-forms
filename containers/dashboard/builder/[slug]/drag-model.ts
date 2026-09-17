import type { FieldConfig } from '@/features/form-builder/elements'
import {
  createFormPage,
  createFormSection,
  type FormPage,
  type FormSection,
  type FormStructure,
} from '@/features/form-builder/form-structure'

export type { FormPage, FormSection, FormStructure }

export const CANVAS_DROP_ID = 'builder-canvas'
export const SECTION_GROUP_ID = 'builder-sections'
export const ITEM_TYPE = 'item'
export const SECTION_TYPE = 'section'
export const PALETTE_FIELD_TYPE = 'palette-field'
export const PALETTE_SECTION_TYPE = 'palette-section'

export interface DropTarget {
  id?: unknown
  index?: unknown
  data?: unknown
  insertAfter?: boolean
}

interface FieldDestination {
  sectionId: string | null
  index: number
}

const isString = (value: unknown): value is string => typeof value === 'string'

export const createSection = (): FormSection => createFormSection()

export const createPage = (): FormPage => createFormPage()

export function getPage(
  structure: FormStructure,
  pageId: string,
): FormPage | undefined {
  return structure.pages.find((page) => page.id === pageId)
}

export function findField(
  page: FormPage | undefined,
  fieldId: string,
): { field: FieldConfig; section: FormSection; index: number } | undefined {
  if (!page) return undefined

  for (const section of page.sections) {
    const index = section.fields.findIndex((field) => field.id === fieldId)
    if (index !== -1) {
      return { field: section.fields[index], section, index }
    }
  }

  return undefined
}

function targetSectionId(
  page: FormPage,
  target: DropTarget,
): string | undefined {
  const targetData = target.data as { sectionId?: unknown } | undefined
  if (isString(targetData?.sectionId)) return targetData.sectionId

  const targetId = String(target.id ?? '')
  if (page.sections.some((section) => section.id === targetId)) {
    return targetId
  }

  return findField(page, targetId)?.section.id
}

function resolveFieldDestination(
  page: FormPage,
  target: DropTarget,
): FieldDestination | undefined {
  const targetId = String(target.id ?? '')

  if (targetId === CANVAS_DROP_ID) {
    const firstSection = page.sections[0]
    return firstSection
      ? { sectionId: firstSection.id, index: firstSection.fields.length }
      : { sectionId: null, index: 0 }
  }

  const sectionId = targetSectionId(page, target)
  if (!sectionId) return undefined

  const targetField = findField(page, targetId)
  const targetSection = page.sections.find((section) => section.id === sectionId)
  if (!targetSection) return undefined
  const isSectionTarget = targetSection.id === targetId

  return {
    sectionId,
    // A section sortable target has a section index, not a field index. A
    // field target gets its own position, while a section target uses the
    // pointer's upper/lower half just like dnd-kit's vertical-list helper.
    index: targetField
      ? targetField.index + (target.insertAfter ? 1 : 0)
      : isSectionTarget && target.insertAfter === false
        ? 0
        : targetSection.fields.length,
  }
}

function updatePage(
  structure: FormStructure,
  pageId: string,
  update: (page: FormPage) => FormPage,
): FormStructure {
  return {
    ...structure,
    pages: structure.pages.map((page) =>
      page.id === pageId ? update(page) : page,
    ),
  }
}

function insertField(
  structure: FormStructure,
  pageId: string,
  field: FieldConfig,
  destination: FieldDestination,
): FormStructure {
  return updatePage(structure, pageId, (currentPage) => ({
    ...currentPage,
    sections: currentPage.sections.map((section) => {
      if (section.id !== destination.sectionId) return section

      const index = Math.min(
        Math.max(destination.index, 0),
        section.fields.length,
      )

      return {
        ...section,
        fields: [
          ...section.fields.slice(0, index),
          field,
          ...section.fields.slice(index),
        ],
      }
    }),
  }))
}

export function removeField(
  structure: FormStructure,
  pageId: string,
  sectionId: string,
  fieldId: string,
): FormStructure {
  return updatePage(structure, pageId, (page) => ({
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.filter((field) => field.id !== fieldId),
          }
        : section,
    ),
  }))
}

export function stagePaletteField(
  structure: FormStructure,
  pageId: string,
  field: FieldConfig,
  target: DropTarget,
): { structure: FormStructure; placed: boolean } {
  const page = getPage(structure, pageId)
  if (!page) return { structure, placed: false }

  if (String(target.id ?? '') === field.id) {
    return { structure, placed: true }
  }

  const stagedField = findField(page, field.id)
  const withoutField = stagedField
    ? removeField(structure, pageId, stagedField.section.id, field.id)
    : structure
  const destinationPage = getPage(withoutField, pageId)
  if (!destinationPage) return { structure, placed: false }

  const destination = resolveFieldDestination(destinationPage, target)
  if (!destination) return { structure: withoutField, placed: false }

  if (destination.sectionId === null) {
    return {
      placed: true,
      structure: updatePage(withoutField, pageId, (currentPage) => ({
        ...currentPage,
        sections: [{ ...createSection(), fields: [field] }, ...currentPage.sections],
      })),
    }
  }

  return {
    placed: true,
    structure: insertField(withoutField, pageId, field, destination),
  }
}

export function moveExistingField(
  structure: FormStructure,
  pageId: string,
  fieldId: string,
  target: DropTarget,
): FormStructure {
  const page = getPage(structure, pageId)
  const source = findField(page, fieldId)
  if (!page || !source) return structure
  if (String(target.id ?? '') === fieldId) return structure

  const withoutField = removeField(
    structure,
    pageId,
    source.section.id,
    fieldId,
  )
  const destinationPage = getPage(withoutField, pageId)
  if (!destinationPage) return structure

  const destination = resolveFieldDestination(destinationPage, target)
  if (!destination?.sectionId) return structure

  return insertField(withoutField, pageId, source.field, destination)
}

export function removeSection(
  structure: FormStructure,
  pageId: string,
  sectionId: string,
): FormStructure {
  return updatePage(structure, pageId, (page) => ({
    ...page,
    sections: page.sections.filter((section) => section.id !== sectionId),
  }))
}

export function removePage(
  structure: FormStructure,
  pageId: string,
): FormStructure {
  if (
    structure.pages.length <= 1 ||
    !structure.pages.some((page) => page.id === pageId)
  ) {
    return structure
  }

  return {
    ...structure,
    pages: structure.pages.filter((page) => page.id !== pageId),
  }
}

export function stagePaletteSection(
  structure: FormStructure,
  pageId: string,
  section: FormSection,
  target: DropTarget,
): { structure: FormStructure; placed: boolean } {
  const page = getPage(structure, pageId)
  if (!page) return { structure, placed: false }

  const targetId = String(target.id ?? '')
  if (targetId === section.id) {
    return { structure, placed: true }
  }

  const withoutSection = removeSection(structure, pageId, section.id)
  const currentPage = getPage(withoutSection, pageId)
  if (!currentPage) return { structure, placed: false }

  const targetIndex =
    targetId === CANVAS_DROP_ID
      ? currentPage.sections.length
      : currentPage.sections.findIndex((candidate) => candidate.id === targetId)

  if (targetIndex < 0) return { structure: withoutSection, placed: false }

  const index = Math.min(
    Math.max(targetIndex + (target.insertAfter ? 1 : 0), 0),
    currentPage.sections.length,
  )

  return {
    placed: true,
    structure: updatePage(withoutSection, pageId, (updatedPage) => ({
      ...updatedPage,
      sections: [
        ...updatedPage.sections.slice(0, index),
        section,
        ...updatedPage.sections.slice(index),
      ],
    })),
  }
}

export function updateField(
  structure: FormStructure,
  pageId: string,
  sectionId: string,
  field: FieldConfig,
): FormStructure {
  return updatePage(structure, pageId, (page) => ({
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map((candidate) =>
              candidate.id === field.id ? field : candidate,
            ),
          }
        : section,
    ),
  }))
}

export function updateSection(
  structure: FormStructure,
  pageId: string,
  section: FormSection,
): FormStructure {
  return updatePage(structure, pageId, (page) => ({
    ...page,
    sections: page.sections.map((candidate) =>
      candidate.id === section.id ? section : candidate,
    ),
  }))
}

export function fieldCount(structure: FormStructure): number {
  return getOrderedFields(structure).length
}

export function getOrderedFields(structure: FormStructure): FieldConfig[] {
  return structure.pages.flatMap((page) =>
    page.sections.flatMap((section) => section.fields),
  )
}
