'use client'

import AccordionWithSwitch from '@/components/accordion-with-switch'
import { EditorProps } from '@/components/FormBuilder/types/types'
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import React, { useState } from 'react'
import { MultiSelectConfig, SelectOption } from './types'

interface MultiSelectEditorProps extends EditorProps<MultiSelectConfig> {
  isOpen: boolean
}

export const MultiSelectEditor: React.FC<MultiSelectEditorProps> = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}) => {
  const [config, setConfig] = useState<MultiSelectConfig>(field)

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
      value: `option_${Date.now()}`,
      disabled: false,
    }

    setConfig((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const handleUpdateOption = (
    index: number,
    updates: Partial<SelectOption>
  ) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, ...updates } : option
      ),
    }))
  }

  const handleRemoveOption = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleMoveOption = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= config.options.length) return

    const newOptions = [...config.options]
    const [movedOption] = newOptions.splice(fromIndex, 1)
    newOptions.splice(toIndex, 0, movedOption)

    setConfig((prev) => ({
      ...prev,
      options: newOptions,
    }))
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
                    {config.options.map((option, index) => (
                      <div
                        key={`${option.value}-${index}`}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <button
                          type="button"
                          className="cursor-grab hover:cursor-grabbing p-1"
                          onMouseDown={(e) => {
                            // Simple drag functionality could be implemented here
                            e.preventDefault()
                          }}
                        >
                          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              handleUpdateOption(index, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Option label"
                            className="text-sm"
                          />
                          <Input
                            value={option.value}
                            onChange={(e) =>
                              handleUpdateOption(index, {
                                value: e.target.value,
                              })
                            }
                            placeholder="Option value"
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Switch
                            checked={!option.disabled}
                            onCheckedChange={(checked) =>
                              handleUpdateOption(index, { disabled: !checked })
                            }
                            aria-label={`Toggle ${option.label}`}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveOption(index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                            aria-label="Move up"
                          >
                            ↑
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveOption(index, index + 1)}
                            disabled={index === config.options.length - 1}
                            className="h-8 w-8 p-0"
                            aria-label="Move down"
                          >
                            ↓
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            aria-label={`Remove ${option.label}`}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="validaton">
              <AccordionTrigger className="text-base">
                Validaton Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="min-length">Min Selections</Label>
                    <Input
                      id="min-selections"
                      type="number"
                      min="0"
                      value={config.minSelections || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'minSelections',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="max-length">Max Selections</Label>
                    <Input
                      id="max-selections"
                      type="number"
                      min="1"
                      value={config.maxSelections || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'maxSelections',
                          e.target.value ? parseInt(e.target.value) : undefined
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
