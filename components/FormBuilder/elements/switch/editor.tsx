'use client'

import { EditorProps } from '@/components/FormBuilder/types/types'
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
import React, { useState } from 'react'
import { SwitchConfig } from './types'

interface SwitchEditorProps extends EditorProps<SwitchConfig> {
  isOpen: boolean
}

export const SwitchEditor: React.FC<SwitchEditorProps> = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}) => {
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
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure Switch</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-4">
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

          <div className="space-y-2">
            <Label htmlFor="field-description">Description</Label>
            <Textarea
              id="field-description"
              value={config.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter field description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checked-label">Checked Label</Label>
            <Input
              id="checked-label"
              value={config.checkedLabel || ''}
              onChange={(e) =>
                handleInputChange('checkedLabel', e.target.value)
              }
              placeholder="e.g., 'Enabled'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unchecked-label">Unchecked Label</Label>
            <Input
              id="unchecked-label"
              value={config.uncheckedLabel || ''}
              onChange={(e) =>
                handleInputChange('uncheckedLabel', e.target.value)
              }
              placeholder="e.g., 'Disabled'"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="default-value-switch">
              Default Value (Checked)
            </Label>
            <Switch
              id="default-value-switch"
              checked={config.defaultValue || false}
              onCheckedChange={(checked) =>
                handleInputChange('defaultValue', checked)
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
        </div>{' '}
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
