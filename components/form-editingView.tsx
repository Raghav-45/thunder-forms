import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { RenderFormFieldEditingView } from '@/components/render-form-field-editingView'
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
  onClickEdit: (fields: FormFieldType) => void
}

export const renderFormFields = (
  fields: FormFieldOrGroup[],
  onClickEdit: (fields: FormFieldType) => void
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
          sd
          {/* {fieldOrGroup.map((field) => (
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
                onClick={() => console.log('onClickEdit')}
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
          ))} */}
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
          <div className="col-span-12 w-full pr-20">
            <div>
              {React.cloneElement(
                RenderFormFieldEditingView(fieldOrGroup) as React.ReactElement,
                // {
                //   ...form,
                // }
                {
                  key: 'fieldOrGroup.className',
                }
              )}
              {/* {RenderFormFieldEditingView(fieldOrGroup) as React.ReactElement} */}
            </div>
          </div>

          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClickEdit(fieldOrGroup)}
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
  onClickEdit,
}) => {
  // Generate Zod schema dynamically based on form fields
  const formSchema = generateZodSchema(formFields)

  // Generate default values for form initialization
  const defaultVals = generateDefaultValues(formFields)

  // Initialize React Hook Form with dynamic schema and default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  })

  // Submit handler function
  function onSubmit(data: z.infer<typeof formSchema>) {
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
        {formFields.length > 0 && (
          <div className="space-y-2 w-full mx-auto">
            {renderFormFields(formFields, onClickEdit)}
            <Button type="submit">Submit</Button>
          </div>
        )}
      </div>
    </div>
  )
}