'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  type ChoiceOption,
  createChoiceOptionId,
  hasValidChoiceOptionValues,
  isChoiceOptionValueInvalid,
} from '@/features/form-builder/elements/choice-options'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import { Label } from '@/components/ui/label'
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

export type SingleSelectOption = ChoiceOption

const FIELD_IDENTIFIER = 'single-select'

export interface SingleSelectConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  options: SingleSelectOption[]
}

// ─── Render Component ────────────────────────────────────

const SingleSelectComponent: React.FC<FieldProps<SingleSelectConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
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

      <Select
        value={(value as string) || ''}
        onValueChange={(val) => onChange(val)}
        disabled={field.disabled}
      >
        <SelectTrigger
          id={inputId}
          className={`w-full ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        >
          <SelectValue placeholder={field.placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem
              key={option.id}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
  isValueInvalid,
}: {
  option: SingleSelectOption
  index: number
  onUpdate: (index: number, updates: Partial<SingleSelectOption>) => void
  onRemove: (index: number) => void
  isValueInvalid: boolean
}) => {
  const { ref, handleRef, isDragging } = useSortable({
    id: option.id,
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
        onChange={(e) =>
          onUpdate(index, { label: e.target.value })
        }
        placeholder="Option label"
        className="text-sm"
      />
      <Input
        value={option.value}
        onChange={(e) =>
          onUpdate(index, { value: e.target.value })
        }
        placeholder="Option value (unique)"
        className={`text-sm ${isValueInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        aria-invalid={isValueInvalid}
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

const SingleSelectEditorComponent: React.FC<
  EditorProps<SingleSelectConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<SingleSelectConfig>(field)
  const hasValidOptionValues = hasValidChoiceOptionValues(config.options)

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
    if (!hasValidOptionValues) return
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof SingleSelectConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddOption = () => {
    const newOption: SingleSelectOption = {
      id: createChoiceOptionId(),
      label: 'New Option',
      value: `option_${crypto.randomUUID()}`,
      disabled: false,
    }
    setConfig((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const handleUpdateOption = (index: number, updates: Partial<SingleSelectOption>) => {
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
          <SheetTitle className="text-lg">Configure Dropdown</SheetTitle>
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
                    placeholder="Enter placeholder text"
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
                    {!hasValidOptionValues && (
                      <p className="text-sm text-red-500" role="alert">
                        Option values must be unique and cannot be blank.
                      </p>
                    )}
                    <DragDropProvider
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                    >
                      {config.options.map((option, index) => (
                        <SortableOptionItem
                          key={option.id}
                          option={option}
                          index={index}
                          onUpdate={handleUpdateOption}
                          onRemove={handleRemoveOption}
                          isValueInvalid={isChoiceOptionValueInvalid(
                            option.value,
                            config.options,
                          )}
                        />
                      ))}
                      <DragOverlay>
                        {(source) => {
                          if (!source) return null

                          const option = config.options.find(
                            (o) => o.id === source.id,
                          )
                          if (!option) return null

                          return (
                            <div className="opacity-50">
                              <SortableOptionItem
                                option={option}
                                index={config.options.findIndex(
                                  (o) => o.id === source.id,
                                )}
                                onUpdate={handleUpdateOption}
                              onRemove={handleRemoveOption}
                              isValueInvalid={isChoiceOptionValueInvalid(
                                option.value,
                                config.options,
                              )}
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
          <Button
            onClick={handleSave}
            disabled={!config.label.trim() || !hasValidOptionValues}
          >
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Field Definition ────────────────────────────────────

export class SingleSelectFieldDefinition extends FormFieldDefinition<SingleSelectConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = SingleSelectComponent
  readonly editor = SingleSelectEditorComponent

  defaultConfig(): SingleSelectConfig {
    return {
      id: `select_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Select an option',
      placeholder: 'Choose one...',
      description: '',
      required: false,
      disabled: false,
      options: [
        { id: createChoiceOptionId(), label: 'Option 1', value: 'option_1' },
        { id: createChoiceOptionId(), label: 'Option 2', value: 'option_2' },
        { id: createChoiceOptionId(), label: 'Option 3', value: 'option_3' },
      ],
    }
  }

  getValidationSchema(field: SingleSelectConfig): z.ZodTypeAny {
    const validValues = field.options
      .filter((option) => !option.disabled)
      .map((option) => option.value)
    const baseSchema = z.string().refine(
      (val) => validValues.includes(val),
      'Please select a valid option',
    )

    return field.required ? baseSchema : baseSchema.optional()
  }
}
