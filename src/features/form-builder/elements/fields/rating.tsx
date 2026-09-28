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
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
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
import { Heart, Star, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const FIELD_IDENTIFIER = 'rating'

type RatingStyle = 'star' | 'heart' | 'thumb' | 'emoji'
type RatingSize = 'sm' | 'default' | 'lg'

export interface RatingConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  maxRating?: number
  step?: 0.5 | 1
  showValue?: boolean
  size?: RatingSize
  style?: RatingStyle
}

const EMOJI_RATINGS = ['😞', '😕', '😐', '😊', '🤩']

function getMaxRating(field: RatingConfig) {
  const max = field.maxRating ?? 5
  return Number.isInteger(max) ? Math.min(Math.max(max, 2), 10) : 5
}

function getStep(field: RatingConfig) {
  return field.style === 'emoji' ? 1 : field.step === 0.5 ? 0.5 : 1
}

function getSizeClass(size: RatingSize | undefined) {
  if (size === 'sm') return 'size-4'
  if (size === 'lg') return 'size-8'
  return 'size-6'
}

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function RatingIcon({
  style,
  fill,
  size,
}: {
  style: Exclude<RatingStyle, 'emoji'>
  fill: number
  size: RatingSize | undefined
}) {
  const Icon = style === 'heart' ? Heart : style === 'thumb' ? ThumbsUp : Star
  const iconClass = getSizeClass(size)

  return (
    <span className={`relative inline-flex ${iconClass}`} aria-hidden="true">
      <Icon className={`${iconClass} text-muted-foreground`} />
      {fill > 0 ? (
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${fill * 100}%` }}
        >
          <Icon className={`${iconClass} shrink-0 fill-amber-400 text-amber-400`} />
        </span>
      ) : null}
    </span>
  )
}

const RatingComponent = ({
  field,
  value,
  onChange,
  error,
}: FieldProps<RatingConfig>) => {
  const [previewValue, setPreviewValue] = useState<number | null>(null)
  const maxRating = getMaxRating(field)
  const step = getStep(field)
  const currentValue = typeof value === 'number' ? value : 0
  const displayedValue = previewValue ?? currentValue
  const inputId = `field-${field.id}`
  const style = field.style ?? 'star'
  const values = Array.from(
    { length: Math.round(maxRating / step) },
    (_, index) => Number(((index + 1) * step).toFixed(1)),
  )

  return (
    <fieldset className="space-y-2" disabled={field.disabled}>
      <legend
        id={`${inputId}-label`}
        className={field.required ? "text-sm font-medium after:ml-1 after:text-red-500 after:content-['*']" : 'text-sm font-medium'}
      >
        {field.label}
      </legend>
      <RadioGroup
        value={currentValue ? String(currentValue) : ''}
        onValueChange={(nextValue) => onChange(Number(nextValue))}
        onMouseLeave={() => setPreviewValue(null)}
        disabled={field.disabled}
        aria-labelledby={`${inputId}-label`}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="flex flex-wrap items-center gap-1"
      >
        {style === 'emoji' ? (
          values.map((rating) => {
            const emojiIndex = Math.min(
              EMOJI_RATINGS.length - 1,
              Math.round((rating / maxRating) * (EMOJI_RATINGS.length - 1)),
            )
            const id = `${inputId}-${rating}`
            const isSelected = rating === displayedValue

            return (
              <span key={rating} className="relative inline-flex">
                <RadioGroupItem
                  id={id}
                  value={String(rating)}
                  className="peer sr-only"
                  onFocus={() => setPreviewValue(rating)}
                  onBlur={() => setPreviewValue(null)}
                />
                <Label
                  htmlFor={id}
                  onMouseEnter={() => setPreviewValue(rating)}
                  className={`grid size-10 cursor-pointer place-items-center rounded-md text-2xl transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                    isSelected ? 'bg-muted' : 'hover:bg-muted/60'
                  }`}
                >
                  <span aria-hidden="true">{EMOJI_RATINGS[emojiIndex]}</span>
                  <span className="sr-only">{formatRating(rating)} out of {maxRating}</span>
                </Label>
              </span>
            )
          })
        ) : (
          Array.from({ length: maxRating }, (_, index) => index + 1).map((unit) => {
            const fill = Math.min(Math.max(displayedValue - (unit - 1), 0), 1)
            const unitValues = values.filter(
              (rating) => rating > unit - 1 && rating <= unit,
            )

            return (
              <span key={unit} className="relative inline-flex">
                <RatingIcon style={style} fill={fill} size={field.size} />
                {unitValues.map((rating) => {
                  const id = `${inputId}-${rating}`
                  const isHalf = step === 0.5 && rating % 1 !== 0

                  return (
                    <span key={rating}>
                      <RadioGroupItem
                        id={id}
                        value={String(rating)}
                        className="peer sr-only"
                        onFocus={() => setPreviewValue(rating)}
                        onBlur={() => setPreviewValue(null)}
                      />
                      <Label
                        htmlFor={id}
                        onMouseEnter={() => setPreviewValue(rating)}
                        className={`absolute inset-y-0 z-10 cursor-pointer peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                          isHalf ? 'left-0 w-1/2' : step === 0.5 ? 'right-0 w-1/2' : 'inset-x-0'
                        }`}
                      >
                        <span className="sr-only">{formatRating(rating)} out of {maxRating}</span>
                      </Label>
                    </span>
                  )
                })}
              </span>
            )
          })
        )}
      </RadioGroup>
      {field.showValue ? (
        <p className="text-sm tabular-nums text-muted-foreground">
          {displayedValue
            ? `${formatRating(displayedValue)} / ${maxRating}`
            : `Select a rating out of ${maxRating}`}
        </p>
      ) : null}
      {field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
      {error ? (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

const RatingEditor = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}: EditorProps<RatingConfig> & { isOpen: boolean }) => {
  const [config, setConfig] = useState<RatingConfig>(field)
  const update = (key: keyof RatingConfig, value: unknown) => {
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
          <SheetTitle className="text-lg">Configure Rating</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 px-4">
          <Accordion type="multiple" defaultValue={['basic']}>
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base">Basic Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-3">
                <div className="space-y-2">
                  <Label htmlFor="rating-label">Field Label *</Label>
                  <Input
                    id="rating-label"
                    value={config.label}
                    onChange={(event) => update('label', event.target.value)}
                    placeholder="Enter field label"
                    required
                  />
                </div>
                <AccordionWithSwitch text="Description" defaultOpen={Boolean(config.description)}>
                  <Textarea
                    id="rating-description"
                    value={config.description ?? ''}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="Help respondents understand the scale"
                    rows={3}
                  />
                </AccordionWithSwitch>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="appearance">
              <AccordionTrigger className="text-base">Rating Appearance</AccordionTrigger>
              <AccordionContent className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rating-style">Style</Label>
                  <Select
                    value={config.style ?? 'star'}
                    onValueChange={(value) => update('style', value as RatingStyle)}
                  >
                    <SelectTrigger id="rating-style"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="star">Stars</SelectItem>
                      <SelectItem value="heart">Hearts</SelectItem>
                      <SelectItem value="thumb">Thumbs up</SelectItem>
                      <SelectItem value="emoji">Emoji reactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="rating-max">Maximum score</Label>
                    <Input
                      id="rating-max"
                      type="number"
                      min="2"
                      max="10"
                      value={getMaxRating(config)}
                      onChange={(event) => update('maxRating', Number(event.target.value) || 5)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating-size">Size</Label>
                    <Select
                      value={config.size ?? 'default'}
                      onValueChange={(value) => update('size', value as RatingSize)}
                    >
                    <SelectTrigger id="rating-size"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="rating-half">Allow half ratings</Label>
                  <Switch
                    id="rating-half"
                    checked={getStep(config) === 0.5}
                    disabled={config.style === 'emoji'}
                    onCheckedChange={(checked) => update('step', checked ? 0.5 : 1)}
                  />
                </div>
                {config.style === 'emoji' ? (
                  <p className="text-xs text-muted-foreground">Emoji reactions use whole ratings.</p>
                ) : null}
                <div className="flex items-center justify-between">
                  <Label htmlFor="rating-value">Show selected value</Label>
                  <Switch
                    id="rating-value"
                    checked={config.showValue ?? false}
                    onCheckedChange={(checked) => update('showValue', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="validation">
              <AccordionTrigger className="text-base">Validation Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rating-required">Required Field</Label>
                  <Switch
                    id="rating-required"
                    checked={config.required ?? false}
                    onCheckedChange={(checked) => update('required', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="rating-disabled">Disabled</Label>
                  <Switch
                    id="rating-disabled"
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
          <Button
            onClick={() => {
              onUpdate(config)
              onClose()
            }}
            disabled={!config.label.trim()}
          >
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export class RatingFieldDefinition extends FormFieldDefinition<RatingConfig> {
  readonly identifier = FIELD_IDENTIFIER
  readonly component = RatingComponent
  readonly editor = RatingEditor

  defaultConfig(): RatingConfig {
    return {
      id: `rating_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Rate your experience',
      description: '',
      required: false,
      disabled: false,
      maxRating: 5,
      step: 1,
      showValue: false,
      size: 'default',
      style: 'star',
    }
  }

  getValidationSchema(field: RatingConfig): z.ZodTypeAny {
    const maxRating = getMaxRating(field)
    const step = getStep(field)
    const schema = z.number().refine(
      (value) =>
        value >= 1 &&
        value <= maxRating &&
        Number.isInteger(value / step),
      `Choose a rating from 1 to ${maxRating}`,
    )
    return field.required ? schema : schema.optional()
  }
}
