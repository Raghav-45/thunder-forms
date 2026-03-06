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
import AccordionWithSwitch from '@/components/accordion-with-switch'
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Config ──────────────────────────────────────────────

export interface SingleSelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SingleSelectConfig extends BaseFieldConfig {
  uniqueIdentifier: 'single-select'
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
              key={option.value}
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
}: {
  option: SingleSelectOption
  index: number
  onUpdate: (index: number, updates: Partial<SingleSelectOption>) => void
  onRemove: (index: number) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.value })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 border rounded-md"
    >
      <button
        type="button"
        className="cursor-grab hover:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
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

const SingleSelectEditorComponent: React.FC<
  EditorProps<SingleSelectConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<SingleSelectConfig>(field)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleSave = () => {
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
      label: 'New Option',
      value: `option_${Date.now()}`,
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setConfig((prev) => {
        const oldIndex = prev.options.findIndex((o) => o.value === active.id)
        const newIndex = prev.options.findIndex((o) => o.value === over.id)
        return { ...prev, options: arrayMove(prev.options, oldIndex, newIndex) }
      })
    }
    setActiveId(null)
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={config.options.map((o) => o.value)}
                        strategy={verticalListSortingStrategy}
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
                      </SortableContext>
                      <DragOverlay>
                        {activeId ? (
                          <div className="opacity-50">
                            {config.options.find((o) => o.value === activeId) && (
                              <SortableOptionItem
                                option={config.options.find((o) => o.value === activeId)!}
                                index={config.options.findIndex((o) => o.value === activeId)}
                                onUpdate={handleUpdateOption}
                                onRemove={handleRemoveOption}
                              />
                            )}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
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

export class SingleSelectFieldDefinition extends FormFieldDefinition<SingleSelectConfig> {
  readonly identifier = 'single-select' as const

  readonly component = SingleSelectComponent
  readonly editor = SingleSelectEditorComponent

  defaultConfig(): SingleSelectConfig {
    return {
      id: `select_${Date.now()}`,
      uniqueIdentifier: 'single-select',
      label: 'Select an option',
      placeholder: 'Choose one...',
      required: false,
      disabled: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' },
      ],
    }
  }

  getValidationSchema(field: SingleSelectConfig): z.ZodTypeAny {
    const validValues = field.options.map((opt) => opt.value)
    const baseSchema = z.string().refine(
      (val) => validValues.includes(val),
      'Please select a valid option',
    )

    return field.required
      ? baseSchema
      : baseSchema.optional()
  }
}
