'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
import { Textarea } from '@/components/ui/textarea'

// ─── Config ──────────────────────────────────────────────

export interface SliderConfig extends BaseFieldConfig {
  uniqueIdentifier: 'slider'
  min?: number
  max?: number
  step?: number
  /** Whether to show the current value next to the slider */
  showValue?: boolean
  /** Optional unit label (e.g., "%", "px", "kg") */
  unit?: string
  /** Default/initial value */
  defaultValue?: number
}

// ─── Render Component ────────────────────────────────────

const SliderComponent: React.FC<FieldProps<SliderConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const min = field.min ?? 0
  const max = field.max ?? 100
  const step = field.step ?? 1
  const currentValue = typeof value === 'number' ? value : (field.defaultValue ?? min)
  const inputId = `field-${field.id}`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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
        {field.showValue !== false && (
          <span className="text-sm font-medium tabular-nums">
            {currentValue}{field.unit ? ` ${field.unit}` : ''}
          </span>
        )}
      </div>

      <Slider
        id={inputId}
        min={min}
        max={max}
        step={step}
        value={[currentValue]}
        onValueChange={([val]) => onChange(val)}
        disabled={field.disabled}
        className={error ? '[&>span:first-child]:bg-red-200' : ''}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{field.unit ? ` ${field.unit}` : ''}</span>
        <span>{max}{field.unit ? ` ${field.unit}` : ''}</span>
      </div>

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

const SliderEditorComponent: React.FC<
  EditorProps<SliderConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<SliderConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof SliderConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Slider</SheetTitle>
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

                <AccordionWithSwitch
                  text="Unit Label"
                  defaultOpen={!!config.unit}
                >
                  <Input
                    id="field-unit"
                    value={config.unit || ''}
                    onChange={(e) =>
                      handleInputChange('unit', e.target.value)
                    }
                    placeholder="e.g., %, px, kg"
                  />
                </AccordionWithSwitch>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show-value-switch">Show Current Value</Label>
                  <Switch
                    id="show-value-switch"
                    checked={config.showValue !== false}
                    onCheckedChange={(checked) =>
                      handleInputChange('showValue', checked)
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="range">
              <AccordionTrigger className="text-base">
                Range Settings
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="min-value">Min Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      value={config.min ?? 0}
                      onChange={(e) =>
                        handleInputChange(
                          'min',
                          e.target.value ? parseFloat(e.target.value) : 0,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="max-value">Max Value</Label>
                    <Input
                      id="max-value"
                      type="number"
                      value={config.max ?? 100}
                      onChange={(e) =>
                        handleInputChange(
                          'max',
                          e.target.value ? parseFloat(e.target.value) : 100,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="step-value">Step</Label>
                    <Input
                      id="step-value"
                      type="number"
                      min="0.01"
                      value={config.step ?? 1}
                      onChange={(e) =>
                        handleInputChange(
                          'step',
                          e.target.value ? parseFloat(e.target.value) : 1,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="default-value">Default Value</Label>
                    <Input
                      id="default-value"
                      type="number"
                      value={config.defaultValue ?? config.min ?? 0}
                      onChange={(e) =>
                        handleInputChange(
                          'defaultValue',
                          e.target.value ? parseFloat(e.target.value) : undefined,
                        )
                      }
                    />
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

export class SliderFieldDefinition extends FormFieldDefinition<SliderConfig> {
  readonly identifier = 'slider' as const

  readonly component = SliderComponent
  readonly editor = SliderEditorComponent

  defaultConfig(): SliderConfig {
    return {
      id: `slider_${Date.now()}`,
      uniqueIdentifier: 'slider',
      label: 'Select a value',
      description: '',
      required: false,
      disabled: false,
      min: 0,
      max: 100,
      step: 1,
      showValue: true,
      defaultValue: 50,
    }
  }

  getValidationSchema(field: SliderConfig): z.ZodTypeAny {
    const min = field.min ?? 0
    const max = field.max ?? 100

    let schema = z
      .number({ required_error: `${field.label} is required` })
      .min(min, `Value must be at least ${min}`)
      .max(max, `Value must be at most ${max}`)

    return field.required ? schema : (schema as z.ZodTypeAny).optional()
  }
}
