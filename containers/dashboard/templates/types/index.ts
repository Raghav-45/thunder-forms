import type { avaliableFieldsType } from '@/features/form-builder/types/types'

export interface TemplateFieldSpec {
  type: avaliableFieldsType
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  options?: { label: string; value: string }[]
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
