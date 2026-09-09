import type { avaliableFieldsType } from '@/features/form-builder/types/types'
import { FORM_TEMPLATES } from '@/containers/dashboard/templates/constants'

/**
 * Built-in form templates.
 *
 * Pure data — no runtime imports from the field registry, so this module is
 * safe to import from both server and client components. Fields are
 * materialized into real `FieldConfig` objects at use-time via
 * `instantiateTemplate` (which calls `createDefaultFieldConfig` and applies
 * these overrides), guaranteeing the shapes always match the registry.
 */

export interface TemplateFieldSpec {
  type: avaliableFieldsType
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  /** For option-based fields (single-select, multi-select, radio-group). */
  options?: { label: string; value: string }[]
  /** For text-input (e.g. 'email', 'url'). */
  inputType?: string
}

export interface TemplateSectionSpec {
  fields: TemplateFieldSpec[]
}

export interface FormTemplateSpec {
  slug: string
  title: string
  description: string
  category: string
  submitButtonText?: string
  sections: TemplateSectionSpec[]
}

export function getTemplateBySlug(slug: string): FormTemplateSpec | undefined {
  return FORM_TEMPLATES.find((template) => template.slug === slug)
}

export function countTemplateFields(template: FormTemplateSpec): number {
  return template.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  )
}
