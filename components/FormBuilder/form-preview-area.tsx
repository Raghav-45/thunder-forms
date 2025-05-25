'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FormFieldPayload } from '@/lib/validators/form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LuPencil, LuTrash2, LuGripVertical } from 'react-icons/lu'
import { RenderFormField } from './render-form-field'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormControl } from '@/components/ui/form'

interface FormPreviewAreaProps {
  formFields: FormFieldPayload[]
  onClickEdit?: (field: FormFieldPayload) => void
  onClickRemove?: (field: FormFieldPayload) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  selectedField?: FormFieldPayload | null
  form: UseFormReturn
  className?: string
}

interface PreviewFieldItemProps {
  field: FormFieldPayload
  form: UseFormReturn
  onClickEdit: (field: FormFieldPayload) => void
  onClickRemove: (field: FormFieldPayload) => void
  selectedField?: FormFieldPayload | null
  index: number
}

const PreviewFieldItem: React.FC<PreviewFieldItemProps> = ({
  field,
  form,
  onClickEdit,
  onClickRemove,
  selectedField,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const isSelected = selectedField?.name === field.name

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn(
        'group relative border-2 border-dashed border-transparent rounded-lg p-4 transition-all duration-200',
        {
          'border-primary/30 bg-primary/5': isSelected,
          'border-border/50 bg-accent/20': isHovered && !isSelected,
          'border-orange-300 bg-orange-50': isDragOver,
        }
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
      }}
    >
      {/* Field Actions - Show on hover or selection */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered || isSelected ? 1 : 0,
          scale: isHovered || isSelected ? 1 : 0.8
        }}
        transition={{ duration: 0.15 }}
        className="absolute -top-2 -right-2 z-10 flex space-x-1"
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 shadow-md border"
          onClick={() => onClickEdit(field)}
        >
          <LuPencil className="h-3 w-3" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 shadow-md"
          onClick={() => onClickRemove(field)}
        >
          <LuTrash2 className="h-3 w-3" />
        </Button>
      </motion.div>

      {/* Drag Handle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10"
      >
        <div className="flex h-8 w-4 items-center justify-center rounded-l-lg bg-muted border border-r-0 cursor-grab active:cursor-grabbing">
          <LuGripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </motion.div>

      {/* Field Preview */}
      <div className="relative">
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className="w-full">
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

      {/* Field Info Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isHovered || isSelected ? 1 : 0,
          y: isHovered || isSelected ? 0 : 10
        }}
        transition={{ duration: 0.15 }}
        className="absolute -bottom-2 left-2 z-10"
      >
        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md shadow-sm border">
          {field.variant} • {field.required ? 'Required' : 'Optional'}
        </div>
      </motion.div>
    </motion.div>
  )
}

const EmptyPreviewState: React.FC<{
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}> = ({ onDragOver, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center h-96 border-4 border-dashed rounded-xl transition-all duration-300',
        isDragOver 
          ? 'border-primary bg-primary/5 border-solid' 
          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
      )}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(e)
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        onDrop(e)
        setIsDragOver(false)
      }}
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
          <LuGripVertical className="w-8 h-8 text-muted-foreground" />
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
    </motion.div>
  )
}

export const FormPreviewArea: React.FC<FormPreviewAreaProps> = ({
  formFields,
  onClickEdit,
  onClickRemove,
  onDrop,
  onDragOver,
  selectedField,
  form,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    onDragOver(e)
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
    onDrop(e)
    setIsDragOver(false)
  }

  if (formFields.length === 0) {
    return (
      <Card className={cn('min-h-[600px] border-2', className)}>
        <CardContent className="p-6">
          <EmptyPreviewState 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        'min-h-[600px] border-2 transition-all duration-300',
        isDragOver && 'border-primary bg-primary/5',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Form Preview</h3>
            <p className="text-sm text-muted-foreground">
              This is how your form will look to users
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {formFields.length} field{formFields.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {formFields.map((field, index) => (
              <PreviewFieldItem
                key={field.name}
                field={field}
                form={form}
                onClickEdit={onClickEdit!}
                onClickRemove={onClickRemove!}
                selectedField={selectedField}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Drop zone at the bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragOver ? 1 : 0.3 }}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Drop fields here to add them to the end of your form
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}
