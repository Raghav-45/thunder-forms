'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import { Label } from '@/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import React, { useState } from 'react'
import { z } from 'zod'
import AccordionWithSwitch from '@/features/form-builder/components/accordion-with-switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import {
  DragDropProvider,
  DragOverlay,
  type DragEndEvent,
} from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { PointerSensor, PointerActivationConstraints, type Sensors } from '@dnd-kit/dom'

// ─── Config ──────────────────────────────────────────────

export interface RadioOption {
  label: string
  value: string
  disabled?: boolean
}

const FIELD_IDENTIFIER = 'radio-group'

export interface RadioGroupConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  options: RadioOption[]
  /** Layout direction for the radio buttons */
  orientation?: 'vertical' | 'horizontal'
}

// ─── Render Component ────────────────────────────────────

const RadioGroupComponent: React.FC<FieldProps<RadioGroupConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const inputId = `field-${field.id}`

  return (
    <div className="space-y-2">
      <Label
        className={`text-sm font-medium ${
          field.required
            ? "after:content-['*'] after:text-red-500 after:ml-1"
            : ''
        }`}
      >
        {field.label}
      </Label>

      <RadioGroup
        value={(value as string) || ''}
        onValueChange={(val) => onChange(val)}
        disabled={field.disabled}
        className={
          field.orientation === 'horizontal'
            ? 'flex flex-wrap gap-4'
            : 'flex flex-col gap-2'
        }
      >
        {field.options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${inputId}-${option.value}`}
              disabled={option.disabled}
              className={error ? 'border-red-500' : ''}
            />
            <Label
              htmlFor={`${inputId}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

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

// ─── Sortable Option Item ─────────────────────────────────

const SortableOptionItem = ({
  option,
  index,
  onUpdate,
  onRemove,
}: {
  option: RadioOption
  index: number
  onUpdate: (index: number, updates: Partial<RadioOption>) => void
  onRemove: (index: number) => void
}) => {
  const { ref, handleRef, isDragging } = useSortable({
    id: option.value,
    index,
  })

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-2 border rounded-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        ref={handleRef}
        type="button"
        className="cursor-grab hover:cursor-grabbing p-1"
      >
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      <Input
        value={option.label}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
        placeholder="Option label"
        className="text-sm"
      />
      <Input
        value={option.value}
        onChange={(e) => onUpdate(index, { value: e.target.value })}
        placeholder="Option value"
        className="text-sm"
      />

      <Switch
        checked={!option.disabled}
        onCheckedChange={(checked) => onUpdate(index, { disabled: !checked })}
        aria-label={`Toggle ${option.label}`}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        aria-label={`Remove ${option.label}`}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Editor Component ────────────────────────────────────

const RadioGroupEditorComponent: React.FC<
  EditorProps<RadioGroupConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<RadioGroupConfig>(field)

  const sensors = (defaults: Sensors) => [
    ...defaults.filter((sensor) => sensor !== PointerSensor),
    PointerSensor.configure({
      activationConstraints(event: PointerEvent, source) {
        if (event.pointerType === 'touch') {
          return [
            new PointerActivationConstraints.Delay({
              value: 500,
              tolerance: { x: 5, y: 5 },
            }),
          ]
        }
        return [new PointerActivationConstraints.Distance({ value: 8 })]
      },
    }),
  ]

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof RadioGroupConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddOption = () => {
    const newOption: RadioOption = {
      label: 'New Option',
      value: `option_${crypto.randomUUID()}`,
      disabled: false,
    }
    setConfig((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const handleUpdateOption = (index: number, updates: Partial<RadioOption>) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, ...updates } : option,
      ),
    }))
  }

  const handleRemoveOption = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { canceled, operation } = event
    if (canceled) return

    const { source } = operation
    if (!isSortable(source)) return

    const { initialIndex, index } = source
    if (initialIndex === index) return

    setConfig((prev) => {
      const options = [...prev.options]
      const [removed] = options.splice(initialIndex, 1)
      options.splice(index, 0, removed)
      return { ...prev, options }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Radio Group</SheetTitle>
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

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="orientation-switch">Horizontal Layout</Label>
                  <Switch
                    id="orientation-switch"
                    checked={config.orientation === 'horizontal'}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        'orientation',
                        checked ? 'horizontal' : 'vertical',
                      )
                    }
                  />
                </div>

                <div className="space-y-4 px-0 py-4">
                  <div className="flex justify-between items-center">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="h-7"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <DragDropProvider
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                    >
                      {config.options.map((option, index) => (
                        <SortableOptionItem
                          key={option.value}
                          option={option}
                          index={index}
                          onUpdate={handleUpdateOption}
                          onRemove={handleRemoveOption}
                        />
                      ))}
                      <DragOverlay>
                        {(source) => {
                          if (!source) return null

                          const option = config.options.find(
                            (o) => o.value === source.id,
                          )
                          if (!option) return null

                          return (
                            <div className="opacity-50">
                              <SortableOptionItem
                                option={option}
                                index={config.options.findIndex(
                                  (o) => o.value === source.id,
                                )}
                                onUpdate={handleUpdateOption}
                                onRemove={handleRemoveOption}
                              />
                            </div>
                          )
                        }}
                      </DragOverlay>
                    </DragDropProvider>
                  </div>
                </div>
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

export class RadioGroupFieldDefinition extends FormFieldDefinition<RadioGroupConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = RadioGroupComponent
  readonly editor = RadioGroupEditorComponent

  defaultConfig(): RadioGroupConfig {
    return {
      id: `radio_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Choose one',
      description: '',
      required: false,
      disabled: false,
      orientation: 'vertical',
      options: [
        { label: 'Option A', value: 'option_a' },
        { label: 'Option B', value: 'option_b' },
        { label: 'Option C', value: 'option_c' },
      ],
    }
  }

  getValidationSchema(field: RadioGroupConfig): z.ZodTypeAny {
    const validValues = field.options.map((opt) => opt.value)
    const baseSchema = z.string().refine(
      (val) => validValues.includes(val),
      'Please select a valid option',
    )

    return field.required ? baseSchema : baseSchema.optional()
  }
}
