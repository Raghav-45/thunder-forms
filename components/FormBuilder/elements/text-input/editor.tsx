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
import React, { useState } from 'react'
import { TextInputConfig } from './types'

interface TextInputEditorProps extends EditorProps<TextInputConfig> {
  isOpen: boolean
}

export const TextInputEditor: React.FC<TextInputEditorProps> = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}) => {
  const [config, setConfig] = useState<TextInputConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof TextInputConfig, value: unknown) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        [key]: value,
      }
      
      // Clear minLength and maxLength when switching to email or URL input types
      // These input types use format validation instead of length validation
      if (key === 'inputType' && (value === 'email' || value === 'url')) {
        newConfig.minLength = undefined
        newConfig.maxLength = undefined
      }
      
      return newConfig
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Text Input</SheetTitle>
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
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="validaton">
              <AccordionTrigger className="text-base">
                Validaton Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 w-full col-span-4">
                    <Label htmlFor="input-type">Input Type</Label>
                    <Select
                      value={config.inputType || 'text'}
                      onValueChange={(value) =>
                        handleInputChange('inputType', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select input type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="password">Password</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-3">
                    <Label 
                      htmlFor="min-length"
                      className={config.inputType === 'email' || config.inputType === 'url' ? 'text-muted-foreground' : ''}
                    >
                      Min Length
                    </Label>
                    <Input
                      id="min-length"
                      type="number"
                      min="0"
                      value={config.minLength || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'minLength',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="0"
                      disabled={config.inputType === 'email' || config.inputType === 'url'}
                      className={config.inputType === 'email' || config.inputType === 'url' ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                    {(config.inputType === 'email' || config.inputType === 'url') && (
                      <p className="text-xs text-muted-foreground">
                        Length validation disabled for {config.inputType} format
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 col-span-3">
                    <Label 
                      htmlFor="max-length"
                      className={config.inputType === 'email' || config.inputType === 'url' ? 'text-muted-foreground' : ''}
                    >
                      Max Length
                    </Label>
                    <Input
                      id="max-length"
                      type="number"
                      min="1"
                      value={config.maxLength || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'maxLength',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="100"
                      disabled={config.inputType === 'email' || config.inputType === 'url'}
                      className={config.inputType === 'email' || config.inputType === 'url' ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                    {(config.inputType === 'email' || config.inputType === 'url') && (
                      <p className="text-xs text-muted-foreground">
                        Length validation disabled for {config.inputType} format
                      </p>
                    )}
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern (Regex)</Label>
                  <Input
                    id="pattern"
                    value={config.pattern || ''}
                    onChange={(e) =>
                      handleInputChange('pattern', e.target.value)
                    }
                    placeholder="^[a-zA-Z0-9]+$"
                  />
                </div> */}

                {/* <div className="space-y-2">
                  <Label htmlFor="autocomplete">Autocomplete</Label>
                  <Input
                    id="autocomplete"
                    value={config.autoComplete || ''}
                    onChange={(e) =>
                      handleInputChange('autoComplete', e.target.value)
                    }
                    placeholder="name, email, etc."
                  />
                </div> */}

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
