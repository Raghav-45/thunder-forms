import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { RenderFormField } from '@/components/render-form-field'
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { FormFieldType } from '@/types/types'

import {
  generateZodSchema,
  generateDefaultValues,
} from '@/components/generate-code-parts'
import { LuPencil, LuTrash2 } from 'react-icons/lu'
import { cn } from '@/lib/utils'

export type FormFieldOrGroup = FormFieldType | FormFieldType[]

export type FormPreviewProps = {
  formFields: FormFieldOrGroup[]
  openEditDialog: (field: FormFieldType) => void
}

const renderFormFields = (
  fields: FormFieldOrGroup[],
  openEditDialog: (field: FormFieldType) => void,
  form: any
) => {
  return fields.map((fieldOrGroup, index) => {
    if (Array.isArray(fieldOrGroup)) {
      // Calculate column span based on number of fields in the group
      const getColSpan = (totalFields: number) => {
        switch (totalFields) {
          case 2:
            return 6 // Two columns
          case 3:
            return 4 // Three columns
          default:
            return 12 // Single column or fallback
        }
      }

      return (
        <div key={index} className="grid grid-cols-12 gap-4">
          {fieldOrGroup.map((field, subIndex) => (
            // Add Wrapper here
            <div className="flex items-center w-full" key={field.name}>
              <div className="w-full text-sm">{field.variant}</div>

              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem
                    className={`col-span-${getColSpan(fieldOrGroup.length)}`}
                  >
                    <FormControl>
                      {React.cloneElement(
                        RenderFormField(field, form) as React.ReactElement,
                        {
                          ...formField,
                        }
                      )}
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(field)}
              >
                <LuPencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                // onClick={removeColumn}
              >
                <LuTrash2 />
              </Button>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        // Add Wrapper here
        <div
          //   className="flex items-center w-full p-4 border rounded-md"
          className={cn(
            'flex flex-row relative p-4 border rounded-md mb-4 cursor-move transition-colors',
            // isDragging ? 'opacity-50 border-dashed z-50' : 'opacity-100',
            'hover:border-primary',
            'bg-background'
          )}
          key={index}
        >
          <FormField
            key={index}
            control={form.control}
            name={fieldOrGroup.name}
            render={({ field: formField }) => (
              <FormItem className="col-span-12 w-full pr-20">
                <FormControl>
                  {React.cloneElement(
                    RenderFormField(fieldOrGroup, form) as React.ReactElement,
                    {
                      ...formField,
                    }
                  )}
                </FormControl>
              </FormItem>
            )}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              // onClick={() => openEditDialog(field)}
            >
              <LuPencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              // onClick={removeColumn}
            >
              <LuTrash2 />
            </Button>
          </div>
        </div>
      )
    }
  })
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  formFields,
  openEditDialog,
}) => {
  const formSchema = generateZodSchema(formFields)

  const defaultVals = generateDefaultValues(formFields)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  })

  function onSubmit(data: any) {
    try {
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      )
    } catch (error) {
      console.error('Form submission error', error)
      toast.error('Failed to submit the form. Please try again.')
    }
  }

  return (
    <div className="w-full h-full col-span-1 rounded-xl flex justify-center">
      <div className="space-y-4 h-full w-full md:max-h-[70vh] overflow-auto">
        {formFields.length > 0 ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 py-5 w-full mx-auto"
            >
              {renderFormFields(formFields, openEditDialog, form)}
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        ) : (
          <div className="h-[50vh] flex justify-center items-center">
            <p>No form element selected yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
