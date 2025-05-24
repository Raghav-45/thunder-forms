import { z } from 'zod'
import { fieldTypes } from '@/constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const availableFieldNames = fieldTypes
  .filter((field) => field.isAvaliable === true)
  .map((field) => field.name)

export const FormValidator = z.object({
  formName: z.string().min(1, { message: 'Form name is required' }),
  formDescription: z.string().optional(),
  formFields: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1, { message: 'Label is required' }),
        type: z.enum(['text', 'email', 'number', 'textarea']),
        required: z.boolean(),
      })
    )
    .nonempty({ message: 'At least one field is required' }),
  maxSubmissions: z.number().optional(),
  expiresAt: z.date().optional(),
  redirectUrl: z.string().url().optional(),
})

export type CreateFormPayload = z.infer<typeof FormValidator>
