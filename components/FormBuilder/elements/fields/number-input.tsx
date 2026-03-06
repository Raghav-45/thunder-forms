'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

// ─── Config ──────────────────────────────────────────────

export interface NumberInputConfig extends BaseFieldConfig {
  uniqueIdentifier: 'number-input'
  min?: number
  max?: number
  step?: number
  allowDecimals?: boolean
}

// ─── Render Component ────────────────────────────────────

const NumberInputComponent: React.FC<FieldProps<NumberInputConfig>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChange('')
      return
    }
    // Allow typing negative sign and decimal point
    if (raw === '-' || raw === '.' || raw === '-.') {
      onChange(raw)
      return
    }
    const num = Number(raw)
    if (!isNaN(num)) {
      onChange(num)
    }
  }

  const handleBlur = () => {
    onBlur?.()
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
        type="number"
        placeholder={field.placeholder}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={field.disabled}
        required={field.required}
        min={field.min}
        max={field.max}
        step={field.step || (field.allowDecimals ? 'any' : 1)}
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

const NumberInputEditorComponent: React.FC<
  EditorProps<NumberInputConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<NumberInputConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof NumberInputConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Number Input</SheetTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Min Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      value={config.min ?? ''}
                      onChange={(e) =>
                        handleInputChange(
                          'min',
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="No limit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-value">Max Value</Label>
                    <Input
                      id="max-value"
                      type="number"
                      value={config.max ?? ''}
                      onChange={(e) =>
                        handleInputChange(
                          'max',
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="step-value">Step</Label>
                  <Input
                    id="step-value"
                    type="number"
                    min="0"
                    value={config.step ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'step',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-decimals">Allow Decimals</Label>
                  <Switch
                    id="allow-decimals"
                    checked={config.allowDecimals || false}
                    onCheckedChange={(checked) =>
                      handleInputChange('allowDecimals', checked)
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

export class NumberInputFieldDefinition extends FormFieldDefinition<NumberInputConfig> {
  readonly identifier = 'number-input' as const

  readonly component = NumberInputComponent
  readonly editor = NumberInputEditorComponent

  defaultConfig(): NumberInputConfig {
    return {
      id: `number_${Date.now()}`,
      uniqueIdentifier: 'number-input',
      label: 'Amount',
      placeholder: 'Enter a number',
      description: '',
      required: false,
      disabled: false,
      allowDecimals: false,
    }
  }

  getValidationSchema(field: NumberInputConfig): z.ZodTypeAny {
    let schema = z.number({ invalid_type_error: 'Must be a number' })

    if (!field.allowDecimals) {
      schema = schema.int('Must be a whole number')
    }
    if (field.min !== undefined) {
      schema = schema.min(field.min, `Must be at least ${field.min}`)
    }
    if (field.max !== undefined) {
      schema = schema.max(field.max, `Must be at most ${field.max}`)
    }

    return field.required ? schema : schema.optional()
  }
}
