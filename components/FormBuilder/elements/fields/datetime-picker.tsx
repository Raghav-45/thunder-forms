'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import AccordionWithSwitch from '@/components/accordion-with-switch'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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

export interface DateTimePickerConfig extends BaseFieldConfig {
  uniqueIdentifier: 'datetime-picker'
  /** Whether to disable past dates */
  disablePastDates?: boolean
  /** Whether to disable future dates */
  disableFutureDates?: boolean
  /** Minimum selectable date+time (ISO string) */
  minDateTime?: string
  /** Maximum selectable date+time (ISO string) */
  maxDateTime?: string
}

// ─── Shared DateTime Popover ─────────────────────────────
// Used in the main component and also in the editor for min/max pickers

const DateTimePopover: React.FC<{
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  isDateDisabled?: (date: Date) => boolean
  placeholder?: string
  error?: boolean
  id?: string
}> = ({ value, onChange, disabled, isDateDisabled, placeholder, error, id }) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = value ? new Date(value) : new Date(date)
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
      onChange(newDate)
    }
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', val: string) => {
    const currentDate = value ? new Date(value) : new Date()
    const newDate = new Date(currentDate)

    if (type === 'hour') {
      const hour = parseInt(val, 10)
      newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour)
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(val, 10))
    } else if (type === 'ampm') {
      const hours = newDate.getHours()
      if (val === 'AM' && hours >= 12) {
        newDate.setHours(hours - 12)
      } else if (val === 'PM' && hours < 12) {
        newDate.setHours(hours + 12)
      }
    }

    onChange(newDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            error && 'border-red-500 focus:border-red-500',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, 'MM/dd/yyyy hh:mm aa')
          ) : (
            <span>{placeholder || 'Pick a date & time'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i + 1)
                  .reverse()
                  .map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        value &&
                        value.getHours() % 12 === hour % 12
                          ? 'default'
                          : 'ghost'
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange('hour', hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      value && value.getMinutes() === minute
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange('minute', minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="">
              <div className="flex sm:flex-col p-2">
                {['AM', 'PM'].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      value &&
                      ((ampm === 'AM' && value.getHours() < 12) ||
                        (ampm === 'PM' && value.getHours() >= 12))
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange('ampm', ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Render Component ────────────────────────────────────

const DateTimePickerComponent: React.FC<FieldProps<DateTimePickerConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const selectedDate = value ? new Date(value as string) : undefined
  const inputId = `field-${field.id}`

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (field.disablePastDates && date < today) return true
    if (field.disableFutureDates && date > today) return true

    // For min/max, disable days that are entirely outside the range
    if (field.minDateTime) {
      const minDate = new Date(field.minDateTime)
      const minDay = new Date(minDate)
      minDay.setHours(0, 0, 0, 0)
      // Disable dates before the min date's day
      if (date < minDay) return true
    }
    if (field.maxDateTime) {
      const maxDate = new Date(field.maxDateTime)
      const maxDay = new Date(maxDate)
      maxDay.setHours(0, 0, 0, 0)
      // Disable dates after the max date's day
      if (date > maxDay) return true
    }

    return false
  }

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

      <DateTimePopover
        id={inputId}
        value={selectedDate}
        onChange={(date) => onChange?.(date ? date.toISOString() : undefined)}
        disabled={field.disabled}
        isDateDisabled={isDateDisabled}
        placeholder={field.placeholder}
        error={!!error}
      />

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

const DateTimePickerEditorComponent: React.FC<
  EditorProps<DateTimePickerConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<DateTimePickerConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof DateTimePickerConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Date & Time Picker</SheetTitle>
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
                    placeholder="e.g., Pick a date & time"
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="constraints">
              <AccordionTrigger className="text-base">
                Date & Time Constraints
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
                  text="Minimum Date & Time"
                  defaultOpen={!!config.minDateTime}
                >
                  <DateTimePopover
                    value={config.minDateTime ? new Date(config.minDateTime) : undefined}
                    onChange={(date) =>
                      handleInputChange('minDateTime', date ? date.toISOString() : undefined)
                    }
                    placeholder="Pick minimum date & time"
                  />
                </AccordionWithSwitch>

                <AccordionWithSwitch
                  text="Maximum Date & Time"
                  defaultOpen={!!config.maxDateTime}
                >
                  <DateTimePopover
                    value={config.maxDateTime ? new Date(config.maxDateTime) : undefined}
                    onChange={(date) =>
                      handleInputChange('maxDateTime', date ? date.toISOString() : undefined)
                    }
                    placeholder="Pick maximum date & time"
                  />
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

export class DateTimePickerFieldDefinition extends FormFieldDefinition<DateTimePickerConfig> {
  readonly identifier = 'datetime-picker' as const

  readonly component = DateTimePickerComponent
  readonly editor = DateTimePickerEditorComponent

  defaultConfig(): DateTimePickerConfig {
    return {
      id: `datetime_${Date.now()}`,
      uniqueIdentifier: 'datetime-picker',
      label: 'Select Date & Time',
      placeholder: 'Pick a date & time',
      description: '',
      required: false,
      disabled: false,
      disablePastDates: false,
      disableFutureDates: false,
    }
  }

  getValidationSchema(field: DateTimePickerConfig): z.ZodTypeAny {
    const baseSchema = z.string().superRefine((val, ctx) => {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a valid date and time',
        })
        return
      }

      if (field.minDateTime) {
        const minDate = new Date(field.minDateTime)
        if (date < minDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Date & time must be on or after ${format(minDate, 'MM/dd/yyyy hh:mm aa')}`,
          })
        }
      }

      if (field.maxDateTime) {
        const maxDate = new Date(field.maxDateTime)
        if (date > maxDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Date & time must be on or before ${format(maxDate, 'MM/dd/yyyy hh:mm aa')}`,
          })
        }
      }

      if (field.disablePastDates) {
        const now = new Date()
        if (date < now) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date & time must not be in the past',
          })
        }
      }

      if (field.disableFutureDates) {
        const now = new Date()
        if (date > now) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date & time must not be in the future',
          })
        }
      }
    })

    return field.required ? baseSchema : baseSchema.optional()
  }
}
