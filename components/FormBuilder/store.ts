import { FieldConfig } from '@/components/FormBuilder/elements'
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
    // Access & Control
    password?: string
    isSpamProtectionEnabled?: boolean
    isIpLimitEnabled?: boolean
    // Integrations
    webhooks?: string[]
    // Notifications
    emailNotifications?: {
      enabled: boolean
      notifyRespondent: boolean
    }
    // Branding
    branding?: {
      showPoweredBy: boolean
      logoUrl?: string
      primaryColor?: string
    }
    thunderMode?: boolean
    // SEO
    seo?: {
      ogTitle?: string
      ogDescription?: string
      ogImage?: string
    }
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
  password: undefined,
  isSpamProtectionEnabled: false,
  isIpLimitEnabled: false,
  webhooks: [],
  emailNotifications: {
    enabled: false,
    notifyRespondent: false,
  },
  branding: {
    showPoweredBy: true,
    logoUrl: undefined,
    primaryColor: undefined,
  },
  thunderMode: false,
  seo: {
    ogTitle: undefined,
    ogDescription: undefined,
    ogImage: undefined,
  },
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
