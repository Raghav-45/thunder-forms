import { z } from 'zod'

export const formTableSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  responses: z.number(),
  createdAt: z.string(),
})

export type FormTableRow = z.infer<typeof formTableSchema>
