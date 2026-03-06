'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'

// ─── Config ──────────────────────────────────────────────

export interface TextAreaConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-area'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}

// ─── Render Component ────────────────────────────────────

const TextAreaComponent: React.FC<FieldProps<TextAreaConfig>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleBlur = () => {
    if (onBlur) {
      onBlur()
    }
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

      <Textarea
        id={inputId}
        placeholder={field.placeholder}
        value={(value || '') as string}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={field.disabled}
        required={field.required}
        autoComplete={field.autoComplete}
        className={error ? 'border-red-500 focus:border-red-500' : ''}
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

const TextAreaEditorComponent: React.FC<
  EditorProps<TextAreaConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<TextAreaConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof TextAreaConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Text Area</SheetTitle>
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
                Validation Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Min Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      min="0"
                      value={config.minLength || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'minLength',
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-length">Max Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      min="1"
                      value={config.maxLength || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'maxLength',
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="500"
                    />
                  </div>
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

export class TextAreaFieldDefinition extends FormFieldDefinition<TextAreaConfig> {
  readonly identifier = 'text-area' as const

  readonly component = TextAreaComponent
  readonly editor = TextAreaEditorComponent

  defaultConfig(): TextAreaConfig {
    return {
      id: `textarea_${Date.now()}`,
      uniqueIdentifier: 'text-area',
      label: 'Your Message',
      placeholder: 'Type your message here.',
      description: 'Your message will be copied to the support team.',
      required: false,
      disabled: false,
      maxLength: undefined,
    }
  }

  getValidationSchema(field: TextAreaConfig): z.ZodTypeAny {
    let schema = z.string()

    if (field.minLength) {
      schema = schema.min(
        field.minLength,
        `Must be at least ${field.minLength} characters`,
      )
    }
    if (field.maxLength) {
      schema = schema.max(
        field.maxLength,
        `Must be at most ${field.maxLength} characters`,
      )
    }
    if (field.pattern) {
      schema = schema.regex(new RegExp(field.pattern), 'Invalid format')
    }

    return field.required ? schema : schema.optional()
  }
}
