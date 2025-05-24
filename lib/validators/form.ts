import { z } from 'zod'
import { fieldTypes } from '@/constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const availableFieldNames = fieldTypes
  .filter((field) => field.isAvaliable === true)
  .map((field) => field.name)

// Create a union type for available variants
const fieldVariantEnum = z.enum(availableFieldNames as [string, ...string[]])

export const FormFieldSchema = z.object({
  checked: z.boolean(),
  label: z.string().min(1, { message: 'Label is required' }),
  description: z.string().optional(),
  required: z.boolean(),
  disabled: z.boolean(),
  name: z.string().min(1, { message: 'Field name is required' }),
  placeholder: z.string().optional(),
  rowIndex: z.number(),
  type: z.string(), // Can be 'text', 'email', 'number', etc. or empty string
  value: z.string(),
  variant: fieldVariantEnum, // This should match your field variants like 'Input', 'Textarea', etc.
  order: z.number(),
  // Functions are not validated in Zod as they're runtime-only
  // onChange, onSelect, setValue are handled at runtime
})

// Form field group schema (array of form fields)
const FormFieldGroupSchema = z.array(FormFieldSchema)

// Form field or group schema (recursive for nested structures)
const FormFieldOrGroupSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([FormFieldSchema, FormFieldGroupSchema])
)

// export type CreateFormPayload = z.infer<typeof FormValidator>
export const CreateFormRequestValidator = z.object({
  formName: z.string().min(1, { message: 'Form name is required' }),
  formDescription: z.string().optional(),
  formFields: z
    .array(FormFieldOrGroupSchema)
    .min(1, { message: 'At least one field is required' }),
  maxSubmissions: z.number().positive().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
  redirectUrl: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .nullable(),
})
