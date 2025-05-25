import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { RenderFormField } from '@/components/FormBuilder/render-form-field'
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

import {
  generateZodSchema,
  generateDefaultValues,
} from '@/components/FormBuilder/generate-code-parts'
import { LuPencil, LuTrash2, LuGripVertical, LuPlus } from 'react-icons/lu'
import { cn } from '@/lib/utils'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { FormFieldPayload } from '@/lib/validators/form'

export type FormPreviewProps = {
  formFields: FormFieldPayload[]
  onClickEdit?: (fields: FormFieldPayload) => void
  onClickRemove?: (fields: FormFieldPayload) => void
  onReorder?: (reorderedElements: FormFieldPayload[]) => void
  selectedField?: FormFieldPayload | null
  behaveAsPreview: boolean
  formId?: string
  afterSubmitted?: () => void
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDropBetween?: (e: React.DragEvent, index: number) => void
}

const DraggableElement = ({
  field,
  form,
  onClickEdit,
  onClickRemove,
  selectedField,
  behaveAsPreview = false,
}: {
  field: FormFieldPayload
  form: UseFormReturn
  onClickEdit: (field: FormFieldPayload) => void
  onClickRemove: (field: FormFieldPayload) => void
  selectedField: FormFieldPayload | null
  behaveAsPreview: boolean
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isElementLifting, setIsElementLifting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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
    >      <motion.div
        className={cn(
          'group relative border-2 border-dashed border-transparent rounded-lg p-6 transition-all duration-200 hover:border-border/50 bg-card',
          isDragging
            ? 'border-primary border-dashed bg-background/85 shadow-lg scale-[1.02]'
            : 'bg-background hover:bg-accent/20 hover:shadow-md',
          selectedField?.name === field.name && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20',
          isElementLifting && 'z-[51]' // Apply z-index conditionally
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Field Actions - Enhanced positioning */}        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered || selectedField?.name === field.name ? 1 : 0,
            scale: isHovered || selectedField?.name === field.name ? 1 : 0.8,
          }}
          transition={{ duration: 0.15 }}
          className="absolute -top-3 -right-3 z-10 flex space-x-2"
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-lg border border-border/50 hover:border-border bg-background/95 backdrop-blur-sm"
            type="button"
            onClick={() => onClickEdit(field)}
          >
            <LuPencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 shadow-lg bg-destructive/90 hover:bg-destructive"
            type="button"
            onClick={() => onClickRemove(field)}
          >
            <LuTrash2 className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        {/* Drag Handle */}        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || selectedField?.name === field.name ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
        >
          <div className="flex h-10 w-6 items-center justify-center rounded-lg bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-accent transition-colors">
            <LuGripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </motion.div>

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

        {/* Field Info Badge */}        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isHovered || selectedField?.name === field.name ? 1 : 0,
            y: isHovered || selectedField?.name === field.name ? 0 : 10,
          }}
          transition={{ duration: 0.15 }}
          className="absolute -bottom-3 left-3 z-10"
        >
          <div className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg border border-primary/20 font-medium">
            {field.variant} • {field.required ? 'Required' : 'Optional'}
          </div>
        </motion.div>
      </motion.div>
    </Reorder.Item>
  ) : (
    <div className="flex flex-row relative pb-4">
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
  )
}

const DropZoneBetween = ({ 
  index, 
  onDropBetween, 
  isDragOver,
  onDragOver,
  onDragLeave 
}: {
  index: number
  onDropBetween?: (e: React.DragEvent, index: number) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ 
        height: isDragOver ? 80 : 20, 
        opacity: isDragOver ? 1 : 0.3 
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "w-full border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center relative",
        isDragOver 
          ? "border-primary bg-primary/10 shadow-lg" 
          : "border-muted-foreground/20 hover:border-muted-foreground/40"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDropBetween?.(e, index)}
    >
      <motion.div
        animate={{ 
          scale: isDragOver ? 1.1 : 0.8,
          opacity: isDragOver ? 1 : 0.5
        }}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <LuPlus className="w-4 h-4" />
        <span className="text-xs font-medium">
          {isDragOver ? 'Drop here' : 'Insert field'}
        </span>
      </motion.div>
    </motion.div>
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
  afterSubmitted,
  onDrop,
  onDragOver,
  onDropBetween,
}) => {
  const formSchema = generateZodSchema(formFields)
  const defaultVals = generateDefaultValues(formFields)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropZoneHover, setDropZoneHover] = useState<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDragOver) onDragOver(e)
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the container itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDrop) onDrop(e)
    setIsDragOver(false)
  }

  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropZoneHover(index)
  }

  const handleDropZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZoneHover(null)
    }
  }

  const handleDropZoneDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDropBetween) onDropBetween(e, index)
    setDropZoneHover(null)
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (behaveAsPreview) {
      const submitFormResponse = async () => {
        const res = await fetch(`/api/forms/${formId}/responses/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to submit form')
        return res.json()
      }

      toast.promise(submitFormResponse(), {
        loading: 'Submitting form...',
        success: () => 'Form submitted successfully!',
        error: 'Failed to submit form',
        finally: afterSubmitted,
        // router.push(`/forms/${formId}/submitted`)
      })
    }
  }  return (
    <div 
      className={cn(
        "w-full h-full col-span-1 rounded-xl flex flex-col transition-all duration-300",
        isDragOver && "bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 flex justify-center">
        <AnimatePresence>
        {formFields.length > 0 ? (
          <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2 w-full mx-auto"
              >
                <motion.div
                  layout
                  className="space-y-4"
                  transition={{
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                >                  {!behaveAsPreview ? (
                    <Reorder.Group
                      axis="y"
                      values={formFields}
                      onReorder={onReorder!}
                      className="space-y-2"
                    >
                      {/* Drop zone at the top */}
                      <DropZoneBetween
                        index={0}
                        onDropBetween={handleDropZoneDrop}
                        isDragOver={dropZoneHover === 0}
                        onDragOver={(e) => handleDropZoneDragOver(e, 0)}
                        onDragLeave={handleDropZoneDragLeave}
                      />

                      {formFields.map((eachField, index) => (
                        <React.Fragment key={eachField.name}>
                          <DraggableElement
                            field={eachField}
                            form={form}
                            onClickEdit={onClickEdit!}
                            onClickRemove={onClickRemove!}
                            selectedField={selectedField!}
                            behaveAsPreview={behaveAsPreview}
                          />
                          
                          {/* Drop zone after each field */}
                          <DropZoneBetween
                            index={index + 1}
                            onDropBetween={handleDropZoneDrop}
                            isDragOver={dropZoneHover === index + 1}
                            onDragOver={(e) => handleDropZoneDragOver(e, index + 1)}
                            onDragLeave={handleDropZoneDragLeave}
                          />
                        </React.Fragment>
                      ))}
                    </Reorder.Group>
                  ) : (
                    formFields.map((eachField) => (
                      <DraggableElement
                        key={eachField.name}
                        field={eachField}
                        form={form}
                        onClickEdit={onClickEdit!}
                        onClickRemove={onClickRemove!}
                        selectedField={selectedField!}
                        behaveAsPreview={behaveAsPreview}
                      />
                    ))
                  )}                </motion.div>

                <motion.div
                  layout
                  initial={{ opacity: 1, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <Button
                    type={behaveAsPreview ? 'submit' : 'button'}
                    className="w-full md:w-auto"
                  >
                    Submit
                  </Button>
                </motion.div>
              </form>
            </Form>
          </motion.div>
        ) : (
          // Empty state with enhanced drop zone
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'flex flex-col items-center justify-center h-96 border-4 border-dashed rounded-xl transition-all duration-300 w-full',
              isDragOver 
                ? 'border-primary bg-primary/5 border-solid scale-105' 
                : 'border-muted-foreground/30 hover:border-muted-foreground/50'
            )}
          >
            <motion.div
              animate={{ 
                scale: isDragOver ? 1.1 : 1,
                rotate: isDragOver ? 3 : 0 
              }}
              transition={{ duration: 0.2 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <motion.div
                  animate={{ 
                    rotate: isDragOver ? 180 : 0,
                    scale: isDragOver ? 1.2 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <svg 
                    className="w-8 h-8 text-muted-foreground" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isDragOver ? 'Drop your field here!' : 'Start building your form'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isDragOver 
                    ? 'Release to add this field to your form'
                    : 'Drag form fields from the sidebar to create your custom form. You can also use AI to generate forms automatically.'
                  }
                </p>
              </div>
            </motion.div>
          </motion.div>        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
