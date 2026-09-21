'use client'

import AccordionWithSwitch from '@/features/form-builder/components/accordion-with-switch'
import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import type {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Clock3 } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const FIELD_IDENTIFIER = 'time-picker'
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const DURATION_PATTERN = /^\d{1,3}:[0-5]\d$/

export interface TimePickerConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  mode?: 'time' | 'duration'
  minuteStep?: number
}

function getMinuteStep(field: TimePickerConfig) {
  return [1, 5, 10, 15, 30].includes(field.minuteStep ?? 1)
    ? field.minuteStep ?? 1
    : 1
}

function isValidValue(value: string, field: TimePickerConfig) {
  const isDuration = field.mode === 'duration'
  if (!(isDuration ? DURATION_PATTERN : TIME_PATTERN).test(value)) return false

  const [, minutes] = value.split(':')
  return Number(minutes) % getMinuteStep(field) === 0
}

function splitDuration(value: unknown) {
  if (typeof value !== 'string' || !DURATION_PATTERN.test(value)) {
    return { hours: '', minutes: '' }
  }

  const [hours, minutes] = value.split(':')
  return { hours, minutes }
}

const TimePickerComponent = ({
  field,
  value,
  onChange,
  error,
}: FieldProps<TimePickerConfig>) => {
  const inputId = `field-${field.id}`
  const isDuration = field.mode === 'duration'
  const minuteStep = getMinuteStep(field)
  const currentValue = typeof value === 'string' ? value : ''
  const duration = splitDuration(value)

  const updateDuration = (part: 'hours' | 'minutes', nextValue: string) => {
    const nextHours = part === 'hours' ? nextValue : duration.hours
    const rawMinutes = part === 'minutes' ? Number(nextValue) : Number(duration.minutes)
    const nextMinutes = Number.isFinite(rawMinutes)
      ? String(Math.max(0, Math.min(59, rawMinutes))).padStart(2, '0')
      : '00'
    onChange(`${nextHours || '0'}:${nextMinutes}`)
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={inputId}
        className={field.required ? "after:ml-1 after:text-red-500 after:content-['*']" : ''}
      >
        {field.label}
      </Label>
      {isDuration ? (
        <div className="grid max-w-sm grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground" htmlFor={`${inputId}-hours`}>
              Hours
            </Label>
            <Input
              id={`${inputId}-hours`}
              type="number"
              min="0"
              max="999"
              inputMode="numeric"
              placeholder="0"
              value={duration.hours}
              disabled={field.disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              onChange={(event) => updateDuration('hours', event.target.value)}
            />
          </div>
          <span className="pb-2 text-muted-foreground" aria-hidden="true">:</span>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground" htmlFor={`${inputId}-minutes`}>
              Minutes
            </Label>
            <Input
              id={`${inputId}-minutes`}
              type="number"
              min="0"
              max="59"
              step={minuteStep}
              inputMode="numeric"
              placeholder="00"
              value={duration.minutes}
              disabled={field.disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              onChange={(event) => updateDuration('minutes', event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="relative max-w-sm">
          <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={inputId}
            type="time"
            step={minuteStep * 60}
            value={currentValue}
            disabled={field.disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="pl-9"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}
      {field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const TimePickerEditor = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}: EditorProps<TimePickerConfig> & { isOpen: boolean }) => {
  const [config, setConfig] = useState<TimePickerConfig>(field)

  const update = (key: keyof TimePickerConfig, value: unknown) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-y-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Time Picker</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 px-4">
          <Accordion type="multiple" defaultValue={['basic']}>
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base">Basic Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-3">
                <div className="space-y-2">
                  <Label htmlFor="time-picker-label">Field Label *</Label>
                  <Input
                    id="time-picker-label"
                    value={config.label}
                    onChange={(event) => update('label', event.target.value)}
                    placeholder="Enter field label"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-picker-mode">Collect</Label>
                  <Select
                    value={config.mode ?? 'time'}
                    onValueChange={(value) =>
                      update('mode', value === 'duration' ? 'duration' : 'time')
                    }
                  >
                    <SelectTrigger id="time-picker-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time of day</SelectItem>
                      <SelectItem value="duration">Elapsed duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-picker-step">Minute interval</Label>
                  <Select
                    value={String(getMinuteStep(config))}
                    onValueChange={(value) => update('minuteStep', Number(value))}
                  >
                    <SelectTrigger id="time-picker-step"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 5, 10, 15, 30].map((step) => (
                        <SelectItem key={step} value={String(step)}>{step} minute{step === 1 ? '' : 's'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <AccordionWithSwitch text="Description" defaultOpen={Boolean(config.description)}>
                  <Textarea
                    id="time-picker-description"
                    value={config.description ?? ''}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="Help respondents give the right time"
                    rows={3}
                  />
                </AccordionWithSwitch>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="validation">
              <AccordionTrigger className="text-base">Validation Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time-picker-required">Required Field</Label>
                  <Switch
                    id="time-picker-required"
                    checked={config.required ?? false}
                    onCheckedChange={(checked) => update('required', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="time-picker-disabled">Disabled</Label>
                  <Switch
                    id="time-picker-disabled"
                    checked={config.disabled ?? false}
                    onCheckedChange={(checked) => update('disabled', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={() => { onUpdate(config); onClose() }} disabled={!config.label.trim()}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export class TimePickerFieldDefinition extends FormFieldDefinition<TimePickerConfig> {
  readonly identifier = FIELD_IDENTIFIER
  readonly component = TimePickerComponent
  readonly editor = TimePickerEditor

  defaultConfig(): TimePickerConfig {
    return {
      id: `time_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Select a time',
      description: '',
      required: false,
      disabled: false,
      mode: 'time',
      minuteStep: 1,
    }
  }

  getValidationSchema(field: TimePickerConfig): z.ZodTypeAny {
    const schema = z.string().refine(
      (value) => isValidValue(value, field),
      `Enter a valid ${field.mode === 'duration' ? 'duration' : 'time'}`,
    )
    return field.required ? schema : schema.optional()
  }
}
