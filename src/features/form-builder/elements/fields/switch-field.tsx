'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Textarea } from '@/components/ui/textarea'

// ─── Config ──────────────────────────────────────────────

const FIELD_IDENTIFIER = 'switch-field'

export interface SwitchConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  checkedLabel?: string
  uncheckedLabel?: string
  /** When required, optionally enforce a specific answer: true (must accept), false (must decline), or undefined (any answer) */
  requiredValue?: boolean
}

// ─── Render Component ────────────────────────────────────

const SwitchFieldComponent: React.FC<FieldProps<SwitchConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const isAnswered = typeof value === 'boolean'
  const isChecked = value === true

  const handleSwitchChange = (checked: boolean) => {
    onChange?.(checked)
  }

  return (
    <div className="space-y-2">
      <div className={`flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm ${
        error ? 'border-red-500' : ''
      }`}>
        <div className="space-y-0.5">
          <Label
            htmlFor={field.id}
            className={`flex items-center gap-2 text-sm leading-none font-medium select-none ${
              field.disabled ? 'opacity-50' : 'cursor-pointer'
            }`}
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAnswered && (
            <span className="text-xs text-muted-foreground">
              {isChecked ? (field.checkedLabel || 'On') : (field.uncheckedLabel || 'Off')}
            </span>
          )}
          <Switch
            id={field.id}
            checked={isChecked}
            onCheckedChange={handleSwitchChange}
            disabled={field.disabled}
            aria-label={field.label}
            tabIndex={0}
            indeterminate={!isAnswered}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Editor Component ────────────────────────────────────

const SwitchEditorComponent: React.FC<
  EditorProps<SwitchConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<SwitchConfig>(field)
  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof SwitchConfig, value: unknown) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value }
      // Clear requiredValue when required is turned off
      if (key === 'required' && !value) {
        updated.requiredValue = undefined
      }
      return updated
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Switch</SheetTitle>
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

                <div className="grid grid-cols-10 gap-4">
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="checked-label">On Label</Label>
                    <Input
                      id="checked-label"
                      value={config.checkedLabel || ''}
                      onChange={(e) =>
                        handleInputChange('checkedLabel', e.target.value)
                      }
                      placeholder="On"
                    />
                  </div>
                  <div className="space-y-2 col-span-5">
                    <Label htmlFor="unchecked-label">Off Label</Label>
                    <Input
                      id="unchecked-label"
                      value={config.uncheckedLabel || ''}
                      onChange={(e) =>
                        handleInputChange('uncheckedLabel', e.target.value)
                      }
                      placeholder="Off"
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

                {config.required && (
                  <div className="space-y-2">
                    <Label htmlFor="required-value">Enforce Specific Answer</Label>
                    <Select
                      value={config.requiredValue === true ? 'true' : config.requiredValue === false ? 'false' : 'any'}
                      onValueChange={(val) =>
                        handleInputChange('requiredValue', val === 'any' ? undefined : val === 'true')
                      }
                    >
                      <SelectTrigger id="required-value" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any answer (user must interact)</SelectItem>
                        <SelectItem value="true">Must accept ({config.checkedLabel || 'On'})</SelectItem>
                        <SelectItem value="false">Must decline ({config.uncheckedLabel || 'Off'})</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {config.requiredValue === undefined && 'User must toggle the switch, but either answer is accepted.'}
                      {config.requiredValue === true && `User must select "${config.checkedLabel || 'On'}" to submit.`}
                      {config.requiredValue === false && `User must select "${config.uncheckedLabel || 'Off'}" to submit.`}
                    </p>
                  </div>
                )}

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

export class SwitchFieldDefinition extends FormFieldDefinition<SwitchConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = SwitchFieldComponent
  readonly editor = SwitchEditorComponent

  defaultConfig(): SwitchConfig {
    return {
      id: `switch_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Toggle option',
      placeholder: '',
      description: '',
      required: false,
      disabled: false,
      checkedLabel: 'On',
      uncheckedLabel: 'Off',
    }
  }

  getValidationSchema(field: SwitchConfig): z.ZodTypeAny {
    if (field.required) {
      let schema: z.ZodTypeAny = z.boolean({ required_error: `${field.label} is required` })

      if (field.requiredValue === true) {
        schema = schema.refine((val) => val === true, {
          message: `${field.label} must be ${field.checkedLabel || 'On'}`,
        })
      } else if (field.requiredValue === false) {
        schema = schema.refine((val) => val === false, {
          message: `${field.label} must be ${field.uncheckedLabel || 'Off'}`,
        })
      }

      return schema
    }
    return z.boolean().optional()
  }
}
