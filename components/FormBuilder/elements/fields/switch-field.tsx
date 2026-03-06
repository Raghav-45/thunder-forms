'use client'

import { FormFieldDefinition } from '@/components/FormBuilder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/components/FormBuilder/types/types'
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
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

// ─── Config ──────────────────────────────────────────────

export interface SwitchConfig extends BaseFieldConfig {
  uniqueIdentifier: 'switch-field'
  defaultValue?: boolean
  checkedLabel?: string
  uncheckedLabel?: string
}

// ─── Render Component ────────────────────────────────────

const SwitchFieldComponent: React.FC<FieldProps<SwitchConfig>> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const handleSwitchChange = (checked: boolean) => {
    onChange?.(checked)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
          {error && (
            <p className="text-sm text-red-500 ml-6" role="alert">
              {error}
            </p>
          )}
        </div>
        <div>
          <Switch
            value={value == true ? 'on' : 'off'}
            id={field.id}
            checked={(value as boolean) || false}
            onCheckedChange={handleSwitchChange}
            disabled={field.disabled}
            aria-label={field.label}
            tabIndex={0}
          />
        </div>
      </div>
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
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
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
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="validaton">
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

export class SwitchFieldDefinition extends FormFieldDefinition<SwitchConfig> {
  readonly identifier = 'switch-field' as const

  readonly component = SwitchFieldComponent
  readonly editor = SwitchEditorComponent

  defaultConfig(): SwitchConfig {
    return {
      id: `switch_${Date.now()}`,
      uniqueIdentifier: 'switch-field',
      label: 'Toggle option',
      placeholder: '',
      description: '',
      required: false,
      disabled: false,
      defaultValue: false,
      checkedLabel: 'On',
      uncheckedLabel: 'Off',
    }
  }

  getValidationSchema(field: SwitchConfig): z.ZodTypeAny {
    const schema = z.boolean()
    return field.required ? schema : schema.optional()
  }
}
