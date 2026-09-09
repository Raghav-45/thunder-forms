import { FieldConfig } from '@/features/form-builder/elements'
import { create } from 'zustand'
import { DEFAULT_FORM_DESCRIPTION, DEFAULT_FORM_TITLE } from './constants'

type FormStore = {
  count: number
  fields: FieldConfig[]
  formSettings: {
    title: string
    description?: string
    expiresAt?: Date
    maxSubmissions?: number
    redirectUrl?: string
    submitButtonText?: string
  }
  // Actions
  setFields: (fields: FieldConfig[]) => void
  setFormSettings: (settings: FormStore['formSettings']) => void
  resetForm: () => void
}

const initialFormSettings = {
  title: DEFAULT_FORM_TITLE,
  description: DEFAULT_FORM_DESCRIPTION,
  expiresAt: undefined,
  maxSubmissions: undefined,
  redirectUrl: undefined,
  submitButtonText: undefined,
}

export const useFormStore = create<FormStore>()((set) => ({
  count: 1,
  fields: [],
  formSettings: initialFormSettings,

  // Direct setters - overwrite entire arrays/objects
  setFields: (fields: FieldConfig[]) => set(() => ({ fields })),

  setFormSettings: (formSettings: FormStore['formSettings']) =>
    set(() => ({ formSettings })),

  // Reset form to initial state
  resetForm: () =>
    set(() => ({
      count: 1,
      fields: [],
      formSettings: initialFormSettings,
    })),
}))
