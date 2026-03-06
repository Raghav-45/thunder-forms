'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
import { Input } from '@/components/ui/input'
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

// ─── Config ──────────────────────────────────────────────

export interface TextInputConfig extends BaseFieldConfig {
  uniqueIdentifier: 'text-input'
  inputType?: 'text' | 'email' | 'password' | 'tel' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: string
  autoComplete?: string
}

// ─── Render Component ────────────────────────────────────

const TextInputComponent: React.FC<FieldProps<TextInputConfig>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      <Input
        id={inputId}
        type={field.inputType || 'text'}
        placeholder={field.placeholder}
        value={(value || '') as string}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={field.disabled}
        required={field.required}
        pattern={field.pattern}
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

const TextInputEditorComponent: React.FC<
  EditorProps<TextInputConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
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
            <AccordionItem value="validation">
              <AccordionTrigger className="text-base">
                Validation Properties
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
                      className={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                          ? 'text-muted-foreground'
                          : ''
                      }
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
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                      disabled={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                      }
                      className={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }
                    />
                    {(config.inputType === 'email' ||
                      config.inputType === 'url') && (
                      <p className="text-xs text-muted-foreground">
                        Length validation disabled for {config.inputType} format
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 col-span-3">
                    <Label
                      htmlFor="max-length"
                      className={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                          ? 'text-muted-foreground'
                          : ''
                      }
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
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="100"
                      disabled={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                      }
                      className={
                        config.inputType === 'email' ||
                        config.inputType === 'url'
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }
                    />
                    {(config.inputType === 'email' ||
                      config.inputType === 'url') && (
                      <p className="text-xs text-muted-foreground">
                        Length validation disabled for {config.inputType} format
                      </p>
                    )}
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

export class TextInputFieldDefinition extends FormFieldDefinition<TextInputConfig> {
  readonly identifier = 'text-input' as const

  readonly component = TextInputComponent
  readonly editor = TextInputEditorComponent

  defaultConfig(): TextInputConfig {
    return {
      id: `text_${Date.now()}`,
      uniqueIdentifier: 'text-input',
      label: 'Your Name',
      placeholder: 'e.g., John Doe',
      description: 'Provide your name for identification.',
      required: false,
      disabled: false,
      inputType: 'text',
    }
  }

  getValidationSchema(field: TextInputConfig): z.ZodTypeAny {
    let schema: z.ZodString

    switch (field.inputType) {
      case 'email':
        schema = z.string().email('Invalid email address')
        break
      case 'url':
        schema = z.string().url('Invalid URL format')
        break
      case 'tel':
        schema = z.string()
        if (field.pattern) {
          schema = schema.regex(
            new RegExp(field.pattern),
            'Invalid phone number format',
          )
        }
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
        break
      default:
        schema = z.string()
        if (field.pattern) {
          schema = schema.regex(new RegExp(field.pattern), 'Invalid format')
        }
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
        break
    }

    return field.required ? schema : schema.optional()
  }
}
