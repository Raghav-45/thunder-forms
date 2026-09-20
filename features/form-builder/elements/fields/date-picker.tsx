'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import AccordionWithSwitch from '@/features/form-builder/components/accordion-with-switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// ─── Config ──────────────────────────────────────────────

const FIELD_IDENTIFIER = 'date-picker'

export interface DatePickerConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  /** Date format string for display (date-fns format) */
  dateFormat?: string
  /** Minimum selectable date (ISO string) */
  minDate?: string
  /** Maximum selectable date (ISO string) */
  maxDate?: string
  /** Whether to disable past dates */
  disablePastDates?: boolean
  /** Whether to disable future dates */
  disableFutureDates?: boolean
}

// ─── Render Component ────────────────────────────────────

const DatePickerComponent: React.FC<FieldProps<DatePickerConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const selectedDate = value ? new Date(value as string) : undefined
  const dateFormat = field.dateFormat || 'PPP'

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (field.disablePastDates && date < today) return true
    if (field.disableFutureDates && date > today) return true
    if (field.minDate && date < new Date(field.minDate)) return true
    if (field.maxDate && date > new Date(field.maxDate)) return true

    return false
  }

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date ? date.toISOString() : undefined)
  }

  const inputId = `field-${field.id}`

  return (
    <div className="space-y-2">
      <Label
        htmlFor={inputId}
        className={`text-sm font-medium ${
          field.required
            ? "after:content-['*'] after:text-red-500 after:ml-1"
            : ''
        }`}
      >
        {field.label}
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            disabled={field.disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              error && 'border-red-500 focus:border-red-500',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, dateFormat)
            ) : (
              <span>{field.placeholder || 'Pick a date'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Editor Component ────────────────────────────────────

const DatePickerEditorComponent: React.FC<
  EditorProps<DatePickerConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<DatePickerConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof DatePickerConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Date Picker</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 px-4">
          <Accordion type="multiple" defaultValue={['basic']}>
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base">
                Basic Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <div className="space-y-2">
                  <Label htmlFor="field-label">Field Label *</Label>
                  <Input
                    id="field-label"
                    value={config.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    placeholder="Enter field label"
                    required
                  />
                </div>

                <AccordionWithSwitch
                  text="Placeholder"
                  defaultOpen={!!config.placeholder}
                >
                  <Input
                    id="field-placeholder"
                    value={config.placeholder || ''}
                    onChange={(e) =>
                      handleInputChange('placeholder', e.target.value)
                    }
                    placeholder="e.g., Pick a date"
                  />
                </AccordionWithSwitch>

                <AccordionWithSwitch
                  text="Description"
                  defaultOpen={!!config.description}
                >
                  <Textarea
                    id="field-description"
                    value={config.description || ''}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Enter field description"
                    rows={3}
                  />
                </AccordionWithSwitch>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={config.dateFormat || 'PPP'}
                    onValueChange={(value) =>
                      handleInputChange('dateFormat', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PPP">
                        {format(new Date(), 'PPP')}
                      </SelectItem>
                      <SelectItem value="PP">
                        {format(new Date(), 'PP')}
                      </SelectItem>
                      <SelectItem value="P">
                        {format(new Date(), 'P')}
                      </SelectItem>
                      <SelectItem value="yyyy-MM-dd">
                        {format(new Date(), 'yyyy-MM-dd')}
                      </SelectItem>
                      <SelectItem value="dd/MM/yyyy">
                        {format(new Date(), 'dd/MM/yyyy')}
                      </SelectItem>
                      <SelectItem value="MM/dd/yyyy">
                        {format(new Date(), 'MM/dd/yyyy')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="constraints">
              <AccordionTrigger className="text-base">
                Date Constraints
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="disable-past">Disable Past Dates</Label>
                  <Switch
                    id="disable-past"
                    checked={config.disablePastDates || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('disablePastDates', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="disable-future">Disable Future Dates</Label>
                  <Switch
                    id="disable-future"
                    checked={config.disableFutureDates || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('disableFutureDates', checked)
                    }
                  />
                </div>

                <AccordionWithSwitch
                  text="Minimum Date"
                  defaultOpen={!!config.minDate}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="min-date"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !config.minDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {config.minDate
                          ? format(new Date(config.minDate), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={config.minDate ? new Date(config.minDate) : undefined}
                        onSelect={(date) =>
                          handleInputChange('minDate', date ? date.toISOString() : undefined)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </AccordionWithSwitch>

                <AccordionWithSwitch
                  text="Maximum Date"
                  defaultOpen={!!config.maxDate}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="max-date"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !config.maxDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {config.maxDate
                          ? format(new Date(config.maxDate), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={config.maxDate ? new Date(config.maxDate) : undefined}
                        onSelect={(date) =>
                          handleInputChange('maxDate', date ? date.toISOString() : undefined)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </AccordionWithSwitch>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="validation">
              <AccordionTrigger className="text-base">
                Validation Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="required-switch">Required Field</Label>
                  <Switch
                    id="required-switch"
                    checked={config.required || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('required', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="disabled-switch">Disabled</Label>
                  <Switch
                    id="disabled-switch"
                    checked={config.disabled || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('disabled', checked)
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!config.label.trim()}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Field Definition ────────────────────────────────────

export class DatePickerFieldDefinition extends FormFieldDefinition<DatePickerConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = DatePickerComponent
  readonly editor = DatePickerEditorComponent

  defaultConfig(): DatePickerConfig {
    return {
      id: `datepicker_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Select Date',
      placeholder: 'Pick a date',
      description: 'Choose a date from the calendar.',
      required: false,
      disabled: false,
      dateFormat: 'PPP',
      disablePastDates: false,
      disableFutureDates: false,
    }
  }

  getValidationSchema(field: DatePickerConfig): z.ZodTypeAny {
    const baseSchema = z.string().superRefine((val, ctx) => {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a valid date',
        })
        return
      }

      if (field.minDate && date < new Date(field.minDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Date must be on or after ${format(new Date(field.minDate), 'PPP')}`,
        })
      }

      if (field.maxDate && date > new Date(field.maxDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Date must be on or before ${format(new Date(field.maxDate), 'PPP')}`,
        })
      }

      if (field.disablePastDates) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date < today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date must not be in the past',
          })
        }
      }

      if (field.disableFutureDates) {
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        if (date > today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date must not be in the future',
          })
        }
      }
    })

    return field.required ? baseSchema : baseSchema.optional()
  }
}
