import React from 'react'
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
  onClickEdit: (fields: FormFieldType) => void
  onClickRemove: (fields: FormFieldType) => void
  onReorder: (reorderedElements: FormFieldOrGroup[]) => void
  behaveAsPreview: boolean
}

interface DraggableElementProps {
  field: FormFieldType
  form: UseFormReturn
  onClickEdit: (field: FormFieldType) => void
  onClickRemove: (field: FormFieldType) => void
}

const DraggableElement = ({
  field,
  form,
  onClickEdit,
  onClickRemove,
}: DraggableElementProps) => {
  const [isDragging, setIsDragging] = React.useState(false)

  return (
    <Reorder.Item
      key={field.name}
      value={field}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 5px 15px rgba(0,0,0,0.25)',
        cursor: 'grabbing',
        zIndex: 50,
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
            : 'bg-background'
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
  )
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  formFields,
  onClickEdit,
  onClickRemove,
  onReorder,
}) => {
  const formSchema = generateZodSchema(formFields)
  const defaultVals = generateDefaultValues(formFields)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      toast.custom(() => (
        <pre className="w-[340px] rounded-lg bg-neutral-800 px-4 py-2">
          <code className="text-white font-mono text-xs">
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      ))
    } catch (error) {
      console.error('Form submission error', error)
      toast.error('Failed to submit the form. Please try again.')
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
            <Reorder.Group
              axis="y"
              values={formFields}
              onReorder={onReorder}
              className="space-y-4"
            >
              {formFields.map(
                (fieldOrGroup) =>
                  !Array.isArray(fieldOrGroup) && (
                    <DraggableElement
                      key={fieldOrGroup.name}
                      field={fieldOrGroup}
                      form={form}
                      onClickEdit={onClickEdit}
                      onClickRemove={onClickRemove}
                    />
                  )
              )}
            </Reorder.Group>
            <Button>Submit</Button>
          </form>
        </Form>
      )}
    </div>
  )
}
