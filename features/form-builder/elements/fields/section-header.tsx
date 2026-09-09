'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types/types'
import { Label } from '@/components/ui/label'
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

export interface SectionHeaderConfig extends BaseFieldConfig {
  uniqueIdentifier: 'section-header'
  headingLevel?: 'h2' | 'h3' | 'h4'
}

// ─── Render Component ────────────────────────────────────

const SectionHeaderComponent: React.FC<FieldProps<SectionHeaderConfig>> = ({
  field,
}) => {
  const HeadingTag = field.headingLevel || 'h3'

  const headingClasses = {
    h2: 'text-2xl font-bold tracking-tight',
    h3: 'text-xl font-semibold tracking-tight',
    h4: 'text-lg font-medium',
  }

  return (
    <div className="space-y-1 py-2">
      <HeadingTag className={headingClasses[HeadingTag]}>
        {field.label}
      </HeadingTag>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}

// ─── Editor Component ────────────────────────────────────

const SectionHeaderEditorComponent: React.FC<
  EditorProps<SectionHeaderConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  const [config, setConfig] = useState<SectionHeaderConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof SectionHeaderConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto gap-y-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Section Header</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 px-4">
          <Accordion type="multiple" defaultValue={['basic']}>
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base">
                Basic Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <div className="space-y-2">
                  <Label htmlFor="field-label">Heading Text *</Label>
                  <Input
                    id="field-label"
                    value={config.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    placeholder="Enter heading text"
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
                    placeholder="Enter description text (optional)"
                    rows={3}
                  />
                </AccordionWithSwitch>

                <div className="space-y-2">
                  <Label htmlFor="heading-level">Heading Size</Label>
                  <Select
                    value={config.headingLevel || 'h3'}
                    onValueChange={(value) =>
                      handleInputChange('headingLevel', value)
                    }
                  >
                    <SelectTrigger id="heading-level" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h2">Large</SelectItem>
                      <SelectItem value="h3">Medium</SelectItem>
                      <SelectItem value="h4">Small</SelectItem>
                    </SelectContent>
                  </Select>
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

export class SectionHeaderFieldDefinition extends FormFieldDefinition<SectionHeaderConfig> {
  readonly identifier = 'section-header' as const

  readonly component = SectionHeaderComponent
  readonly editor = SectionHeaderEditorComponent

  defaultConfig(): SectionHeaderConfig {
    return {
      id: `section_${Date.now()}`,
      uniqueIdentifier: 'section-header',
      label: 'Section Title',
      description: '',
      required: false,
      disabled: false,
      headingLevel: 'h3',
    }
  }

  getValidationSchema(): z.ZodTypeAny {
    // Section headers are non-input display elements — no validation needed
    return z.any().optional()
  }
}
