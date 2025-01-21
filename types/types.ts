import * as Locales from 'date-fns/locale'

import { forms as FormType } from '@prisma/client'
import { response as ResponseType } from '@prisma/client'

// Define the FormField type
export type FormFieldType = {
  type: string
  variant: string
  name: string
  label: string
  placeholder?: string
  description?: string
  disabled: boolean
  value: string | boolean | Date | number | string[]
  setValue: (value: string | boolean) => void
  checked: boolean
  onChange: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void
  onSelect: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void
  rowIndex: number
  required?: boolean
  min?: number
  max?: number
  step?: number
  locale?: keyof typeof Locales
  hour12?: boolean
  className?: string
  order: number
}

export type FieldType = { name: string; isAvaliable: boolean; index?: number }

export type FormFieldOrGroup = FormFieldType | FormFieldType[]

export type { FormType, ResponseType }
