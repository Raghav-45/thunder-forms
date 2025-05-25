import { z } from 'zod'
// import * as Locales from 'date-fns/locale'
import { fieldTypes } from '@/constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const availableFieldNames = fieldTypes
  .filter((field) => field.isAvaliable === true)
  .map((field) => field.name)

// Create a union type for available variants
const fieldVariantEnum = z.enum(availableFieldNames as [string, ...string[]])

export const FormFieldSchema = z.object({
  checked: z.boolean().optional(),
  label: z.string().min(1, { message: 'Label is required' }),
  description: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  name: z.string().min(1, { message: 'Field name is required' }),
  placeholder: z.string().optional(),
  rowIndex: z.number(),
  type: z.string(), // Can be 'text', 'email', 'number', etc. or empty string
  value: z.string().optional(),
  variant: fieldVariantEnum, // This should match your field variants like 'Input', 'Textarea', etc.
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  locale: z.string().optional(), // Adjust as per the actual type = keyof typeof Locales
  hour12: z.boolean().optional(),
  order: z.number(),
  // Functions are not validated in Zod as they're runtime-only
  // onChange, onSelect, setValue are handled at runtime
})

// Form field group schema (array of form fields)
// const FormFieldGroupSchema = z.array(FormFieldSchema)

// Form field or group schema (recursive for nested structures)
// const FormFieldOrGroupSchema: z.ZodType<unknown> = z.lazy(() =>
//   z.union([FormFieldSchema, FormFieldGroupSchema])
// )

export const CreateFormRequestValidator = z.object({
  formName: z.string().min(1, { message: 'Form name is required' }),
  formDescription: z.string().optional(),
  formFields: z
    .array(FormFieldSchema)
    .min(1, { message: 'At least one field is required' }),
  maxSubmissions: z.number().positive().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
  redirectUrl: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .nullable(),
})

export type CreateFormPayload = z.infer<typeof CreateFormRequestValidator>
export type FormFieldPayload = z.infer<typeof FormFieldSchema>
