/* eslint-disable @typescript-eslint/no-explicit-any */
import { FIELD_REGISTRY, FieldConfig } from '@/components/FormBuilder/elements'
import { z } from 'zod'

export const generateZodSchema = (
  formFields: FieldConfig[]
): z.ZodObject<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  formFields.forEach((field) => {
    const registry = FIELD_REGISTRY[field.uniqueIdentifier]
    if (registry?.getValidationSchema) {
      schemaObject[field.id] = registry.getValidationSchema(field as any)
    }
  })

  return z.object(schemaObject)
}
