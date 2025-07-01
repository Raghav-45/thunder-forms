/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { FieldConfig } from '../elements'

export const generateZodSchema = (
  formFields: FieldConfig[]
): z.ZodObject<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  const processField = (field: FieldConfig): void => {
    if ((field.uniqueIdentifier as string) === 'Label') return

    let fieldSchema: z.ZodTypeAny

    switch (field.uniqueIdentifier) {
      case 'text-input':
        if (field.inputType === 'text') {
          let textSchema = z.string()

          if (field.minLength) {
            textSchema = textSchema.min(
              field.minLength,
              `Must be at least ${field.minLength} characters`
            )
          }
          if (field.maxLength) {
            textSchema = textSchema.max(
              field.maxLength,
              `Must be at most ${field.maxLength} characters`
            )
          }
          if (field.pattern) {
            textSchema = textSchema.regex(
              new RegExp(field.pattern),
              'Invalid format'
            )
          }

          fieldSchema = textSchema
        } else if (field.inputType === 'email') {
          let emailSchema = z.string().email('Invalid email address')

          if (field.minLength) {
            emailSchema = emailSchema.min(
              field.minLength,
              `Must be at least ${field.minLength} characters`
            )
          }
          if (field.maxLength) {
            emailSchema = emailSchema.max(
              field.maxLength,
              `Must be at most ${field.maxLength} characters`
            )
          }

          fieldSchema = emailSchema
        // } else if (field.inputType === 'url') {
        //   let emailSchema = z.string().email('Invalid email address')

        //   if (field.minLength) {
        //     emailSchema = emailSchema.min(
        //       field.minLength,
        //       `Must be at least ${field.minLength} characters`
        //     )
        //   }
        //   if (field.maxLength) {
        //     emailSchema = emailSchema.max(
        //       field.maxLength,
        //       `Must be at most ${field.maxLength} characters`
        //     )
        //   }

        //   fieldSchema = emailSchema
        } else {
          // Handle regular text input
          let stringSchema = z.string()

          if (field.minLength) {
            stringSchema = stringSchema.min(
              field.minLength,
              `Must be at least ${field.minLength} characters`
            )
          }
          if (field.maxLength) {
            stringSchema = stringSchema.max(
              field.maxLength,
              `Must be at most ${field.maxLength} characters`
            )
          }
          if (field.pattern) {
            stringSchema = stringSchema.regex(
              new RegExp(field.pattern),
              'Invalid format'
            )
          }

          fieldSchema = stringSchema
        }
        break

      default:
        fieldSchema = z.string()
        break
    }

    // Handle required/optional fields
    if (field.required) {
      // @ts-expect-error: ZodTypeAny doesn't have a required() method, but we handle this via the schema itself
      fieldSchema = fieldSchema.required(`Field is required`) // If the field is required
    } else {
      fieldSchema = fieldSchema.optional() // If the field is optional
    }

    schemaObject[field.uniqueIdentifier] = fieldSchema
  }

  formFields.flat().forEach(processField)

  return z.object(schemaObject)
}
