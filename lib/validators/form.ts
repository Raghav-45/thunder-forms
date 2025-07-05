import { z } from 'zod'

export const FormValidator = z.object({
  title: z.string().min(10, 'Title is required'),
  description: z.string().optional(),
  formFields: z.unknown(), // Assuming formFields is a complex object, adjust as necessary
  maxSubmissions: z.number().int().min(1, 'Must be at least 1').optional(),
  expiresAt: z
    .coerce
    .date()
    .min(new Date(), 'Expiration date must be in the future')
    .optional(),
  redirectUrl: z.string().url('Must be a valid URL').optional(),
})

export type CreateFormPayload = z.infer<typeof FormValidator>

// export const FormUpdateValidator = z.object({
//   title: z.string().min(10, 'Title is required').optional(),
//   description: z.string().min(10, 'Title is required').optional(),
//   formFields: z.unknown(), // Assuming formFields is a complex object, adjust as necessary
//   maxSubmissions: z.number().int().min(1, 'Must be at least 1').optional(),
//   expiresAt: z.date().optional(),
//   redirectUrl: z.string().url('Must be a valid URL').optional(),
// })
