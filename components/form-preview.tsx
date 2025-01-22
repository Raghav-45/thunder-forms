import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm, UseFormReturn } from 'react-hook-form'
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
import { Reorder } from 'framer-motion'

export type FormFieldOrGroup = FormFieldType | FormFieldType[]

export type FormPreviewProps = {
  formFields: FormFieldOrGroup[]
  onClickEdit?: (fields: FormFieldType) => void
  onClickRemove?: (fields: FormFieldType) => void
  onReorder?: (reorderedElements: FormFieldOrGroup[]) => void
  selectedField?: FormFieldType | null
  behaveAsPreview: boolean
  formId?: string
}

const DraggableElement = ({
  field,
  form,
  onClickEdit,
  onClickRemove,
  selectedField,
  behaveAsPreview = false,
}: {
  field: FormFieldType
  form: UseFormReturn
  onClickEdit: (field: FormFieldType) => void
  onClickRemove: (field: FormFieldType) => void
  selectedField: FormFieldType | null
  behaveAsPreview: boolean
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isElementLifting, setIsElementLifting] = useState(false)

  useEffect(() => {
    if (selectedField?.name === field.name) {
      setIsElementLifting(true)
    } else if (selectedField === null) {
      const timeout = setTimeout(() => {
        setIsElementLifting(false)
      }, 350) // delay in milliseconds

      return () => clearTimeout(timeout) // Cleanup timeout
    }
  }, [selectedField, field.name])

  return !behaveAsPreview ? (
    <Reorder.Item
      key={field.name}
      value={field}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 5px 15px rgba(0,0,0,0.25)',
        cursor: 'grabbing',
        zIndex: 10,
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      style={{
        position: 'relative',
        touchAction: 'none',
        cursor: 'grab',
      }}
      className="relative"
    >
      <div
        className={cn(
          'flex flex-row relative p-4 border rounded-md mb-4 transition-colors hover:border-primary',
          isDragging
            ? 'border-primary border-dashed bg-background/85'
            : 'bg-background',
          // selectedField?.name === field.name && 'border border-primary/15 border-dashed',
          isElementLifting && 'z-[51]' // Apply z-index conditionally
        )}
      >
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className="col-span-12 w-full pr-28">
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

        <div className="absolute right-2 top-1/2 -translate-y-1/2 space-x-2 mr-4">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => onClickEdit(field)}
          >
            <LuPencil />
          </Button>
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => onClickRemove(field)}
          >
            <LuTrash2 />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  ) : (
    <p>
      <div
        className={cn(
          'flex flex-row relative rounded-md mb-4 transition-colors hover:border-primary bg-background'
        )}
      >
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className="col-span-12 w-full">
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
      </div>
    </p>
  )
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  formFields,
  onClickEdit,
  onClickRemove,
  onReorder,
  selectedField,
  behaveAsPreview,
  formId,
}) => {
  const formSchema = generateZodSchema(formFields)
  const defaultVals = generateDefaultValues(formFields)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // try {
    //   toast.custom(() => (
    //     <pre className="w-[340px] rounded-lg bg-neutral-800 px-4 py-2">
    //       <code className="text-white font-mono text-xs">
    //         {JSON.stringify(data, null, 2)}
    //       </code>
    //     </pre>
    //   ))
    // } catch (error) {
    //   console.error('Form submission error', error)
    //   toast.error('Failed to submit the form. Please try again.')
    // }
    if (behaveAsPreview) {
      try {
        // await createResponse(formId!, data)

        await fetch(`/api/forms/${formId}/responses/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        toast.success('Form submitted successfully!')
      } catch (error) {
        console.error('Form submission error', error)
        toast.error('Failed to submit the form. Please try again.')
      }
    }
  }

  return (
    <div className="w-full h-full col-span-1 rounded-xl flex justify-center">
      {formFields.length > 0 && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 w-full mx-auto"
          >
            {!behaveAsPreview ? (
              <Reorder.Group
                axis="y"
                values={formFields}
                onReorder={onReorder!}
                className="space-y-4"
              >
                {formFields.map(
                  (fieldOrGroup) =>
                    !Array.isArray(fieldOrGroup) && (
                      <DraggableElement
                        key={fieldOrGroup.name}
                        field={fieldOrGroup}
                        form={form}
                        onClickEdit={onClickEdit!}
                        onClickRemove={onClickRemove!}
                        selectedField={selectedField!}
                        behaveAsPreview={behaveAsPreview}
                      />
                    )
                )}
              </Reorder.Group>
            ) : (
              formFields.map(
                (fieldOrGroup) =>
                  !Array.isArray(fieldOrGroup) && (
                    <DraggableElement
                      key={fieldOrGroup.name}
                      field={fieldOrGroup}
                      form={form}
                      onClickEdit={onClickEdit!}
                      onClickRemove={onClickRemove!}
                      selectedField={selectedField!}
                      behaveAsPreview={behaveAsPreview}
                    />
                  )
              )
            )}
            <Button>Submit</Button>
          </form>
        </Form>
      )}
    </div>
  )
}
