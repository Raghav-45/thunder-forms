'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Check,
  ChevronsUpDown,
  X,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import React, { useState } from 'react'
import { z } from 'zod'
import AccordionWithSwitch from '@/features/form-builder/components/accordion-with-switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  DragDropProvider,
  DragOverlay,
  type DragEndEvent,
} from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { PointerSensor, PointerActivationConstraints, type Sensors } from '@dnd-kit/dom'

// ─── Config ──────────────────────────────────────────────

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

const FIELD_IDENTIFIER = 'multi-select'

export interface MultiSelectConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  options: SelectOption[]
  minSelections?: number
  maxSelections?: number
  searchable?: boolean
  allowCustomValues?: boolean
}

// ─── Render Component ────────────────────────────────────

const MultiSelectComponent: React.FC<FieldProps<MultiSelectConfig>> = ({
  field,
  value = [],
  onChange,
  error,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const selectedValues = Array.isArray(value) ? value : []

  const handleSelect = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]

    if (field.maxSelections && newValues.length > field.maxSelections) {
      return
    }

    onChange(newValues)
  }

  const handleRemove = (optionValue: string) => {
    const newValues = selectedValues.filter((v) => v !== optionValue)
    onChange(newValues)
  }

  const handleAddCustomValue = () => {
    if (!field.allowCustomValues || !searchValue.trim()) return

    const customValue = searchValue.trim()
    if (!selectedValues.includes(customValue)) {
      const newValues = [...selectedValues, customValue]
      if (field.maxSelections && newValues.length > field.maxSelections) {
        return
      }
      onChange(newValues)
    }
    setSearchValue('')
  }

  const getSelectedOptions = () => {
    return selectedValues.map((val) => {
      const option = field.options.find((opt) => opt.value === val)
      return option || { label: val, value: val }
    })
  }

  const getAvailableOptions = () => {
    return field.options.filter(
      (option) =>
        !searchValue ||
        option.label.toLowerCase().includes(searchValue.toLowerCase()),
    )
  }

  const fieldId = `field-${field.id}`
  const canAddMore =
    !field.maxSelections || selectedValues.length < field.maxSelections

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className={`text-sm font-medium ${
          field.required
            ? "after:content-['*'] after:text-red-500 after:ml-1"
            : ''
        }`}
      >
        {field.label}
      </Label>

      <div className="space-y-2">
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getSelectedOptions().map((option) => (
              <Badge key={option.value} variant="secondary" className="text-xs">
                {option.label}
                <button
                  type="button"
                  onClick={() => handleRemove(option.value)}
                  disabled={field.disabled}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={`w-full justify-between ${
                error ? 'border-red-500' : ''
              }`}
              disabled={field.disabled || !canAddMore}
            >
              {selectedValues.length === 0
                ? field.placeholder || 'Select options...'
                : `${selectedValues.length} selected`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0" align="start">
            <Command>
              {field.searchable && (
                <CommandInput
                  value={searchValue}
                  onValueChange={setSearchValue}
                  placeholder="Search options..."
                />
              )}

              <CommandEmpty>
                {field.allowCustomValues && searchValue.trim() ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCustomValue}
                      className="w-full"
                    >
                      Add &quot;{searchValue}&quot;
                    </Button>
                  </div>
                ) : (
                  'No options found.'
                )}
              </CommandEmpty>

              <CommandGroup className="max-h-64 overflow-auto">
                {getAvailableOptions().map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedValues.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Sortable Option Item (used by Editor) ───────────────

const SortableOptionItem = ({
  option,
  index,
  onUpdate,
  onRemove,
}: {
  option: SelectOption
  index: number
  onUpdate: (index: number, updates: Partial<SelectOption>) => void
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
        onChange={(e) =>
          onUpdate(index, {
            label: e.target.value,
          })
        }
        placeholder="Option label"
        className="text-sm"
      />
      <Input
        value={option.value}
        onChange={(e) =>
          onUpdate(index, {
            value: e.target.value,
          })
        }
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

const MultiSelectEditorComponent: React.FC<
  EditorProps<MultiSelectConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<MultiSelectConfig>(field)

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

  const handleInputChange = (key: keyof MultiSelectConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleAddOption = () => {
    const newOption: SelectOption = {
      label: 'New Option',
      value: `option_${crypto.randomUUID()}`,
      disabled: false,
    }

    setConfig((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const handleUpdateOption = (
    index: number,
    updates: Partial<SelectOption>,
  ) => {
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
          <SheetTitle className="text-lg">Configure Multi Select</SheetTitle>
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
                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="min-selections">Min Selections</Label>
                    <Input
                      id="min-selections"
                      type="number"
                      min="0"
                      value={config.minSelections || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'minSelections',
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="max-selections">Max Selections</Label>
                    <Input
                      id="max-selections"
                      type="number"
                      min="1"
                      value={config.maxSelections || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'maxSelections',
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="searchable-switch">Searchable</Label>
                  <Switch
                    id="searchable-switch"
                    checked={config.searchable || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('searchable', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-values-switch">
                    Allow Custom Values
                  </Label>
                  <Switch
                    id="custom-values-switch"
                    checked={config.allowCustomValues || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('allowCustomValues', checked)
                    }
                  />
                </div>

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

export class MultiSelectFieldDefinition extends FormFieldDefinition<MultiSelectConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = MultiSelectComponent
  readonly editor = MultiSelectEditorComponent

  defaultConfig(): MultiSelectConfig {
    return {
      id: `multiselect_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Select your framework',
      placeholder: 'Select multiple options',
      description: '',
      required: false,
      disabled: false,
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Blueberry', value: 'blueberry' },
        { label: 'Grapes', value: 'grapes' },
        { label: 'Pineapple', value: 'pineapple' },
      ],
      searchable: true,
      allowCustomValues: false,
    }
  }

  getValidationSchema(field: MultiSelectConfig): z.ZodTypeAny {
    let schema: z.ZodTypeAny = z.array(z.string())

    if (field.minSelections) {
      schema = (schema as z.ZodArray<z.ZodString, 'many'>).min(
        field.minSelections,
        `Select at least ${field.minSelections} option${
          field.minSelections > 1 ? 's' : ''
        }`,
      )
    }
    if (field.maxSelections) {
      schema = (schema as z.ZodArray<z.ZodString, 'many'>).max(
        field.maxSelections,
        `Select at most ${field.maxSelections} option${
          field.maxSelections > 1 ? 's' : ''
        }`,
      )
    }

    if (!field.allowCustomValues) {
      const validValues = field.options.map((opt) => opt.value)
      schema = schema.refine(
        (values) =>
          (values as string[]).every((val) => validValues.includes(val)),
        'Invalid option selected',
      )
    }

    return field.required ? schema : schema.optional()
  }
}
