'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types'
import { Checkbox } from '@/components/ui/checkbox'
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

const FIELD_IDENTIFIER = 'checkbox'

export interface CheckboxConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  checkedLabel?: string
  uncheckedLabel?: string
  /** When required, optionally enforce a specific answer: true (must check), false (must uncheck), or undefined (any answer) */
  requiredValue?: boolean
}

// ─── Render Component ────────────────────────────────────

const CheckboxComponent: React.FC<FieldProps<CheckboxConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const isAnswered = typeof value === 'boolean'
  const checkedState: boolean | 'indeterminate' = !isAnswered ? 'indeterminate' : (value as boolean)

  const handleChange = (checked: boolean | 'indeterminate') => {
    // When clicking from indeterminate, treat as checking (true)
    // When clicking from checked, uncheck (false)
    // When clicking from unchecked, check (true)
    if (checked === 'indeterminate') {
      onChange?.(true)
    } else {
      onChange?.(checked)
    }
  }

  const inputId = `field-${field.id}`

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-row items-start gap-3 rounded-lg border p-3 shadow-sm ${
          error ? 'border-red-500' : ''
        }`}
      >
        <Checkbox
          id={inputId}
          checked={checkedState}
          onCheckedChange={handleChange}
          disabled={field.disabled}
          aria-label={field.label}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label
            htmlFor={inputId}
            className={`text-sm leading-none font-medium select-none ${
              field.disabled ? 'opacity-50' : 'cursor-pointer'
            }`}
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
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

const CheckboxEditorComponent: React.FC<
  EditorProps<CheckboxConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<CheckboxConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof CheckboxConfig, value: unknown) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value }
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
          <SheetTitle className="text-lg">Configure Checkbox</SheetTitle>
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
                        <SelectItem value="true">Must be checked</SelectItem>
                        <SelectItem value="false">Must be unchecked</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {config.requiredValue === undefined && 'User must click the checkbox, but either state is accepted.'}
                      {config.requiredValue === true && 'User must check the checkbox to submit (e.g., "I agree to terms").'}
                      {config.requiredValue === false && 'User must leave the checkbox unchecked to submit.'}
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

export class CheckboxFieldDefinition extends FormFieldDefinition<CheckboxConfig> {
  readonly identifier = FIELD_IDENTIFIER

  readonly component = CheckboxComponent
  readonly editor = CheckboxEditorComponent

  defaultConfig(): CheckboxConfig {
    return {
      id: `checkbox_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'I agree to the terms',
      placeholder: '',
      description: '',
      required: false,
      disabled: false,
    }
  }

  getValidationSchema(field: CheckboxConfig): z.ZodTypeAny {
    if (field.required) {
      let schema: z.ZodTypeAny = z.boolean({ required_error: `${field.label} is required` })

      if (field.requiredValue === true) {
        schema = schema.refine((val) => val === true, {
          message: `${field.label} must be checked`,
        })
      } else if (field.requiredValue === false) {
        schema = schema.refine((val) => val === false, {
          message: `${field.label} must be unchecked`,
        })
      }

      return schema
    }
    return z.boolean().optional()
  }
}
