'use client'

import { EditorProps } from '@/components/FormBuilder/types/types'
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
import { TextAreaConfig } from './types'

interface TextAreaEditorProps extends EditorProps<TextAreaConfig> {
  isOpen: boolean
}

export const TextAreaEditor: React.FC<TextAreaEditorProps> = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}) => {
  const [config, setConfig] = useState<TextAreaConfig>(field)

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  const handleInputChange = (key: keyof TextAreaConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure Text Input</SheetTitle>
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
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={config.placeholder || ''}
              onChange={(e) => handleInputChange('placeholder', e.target.value)}
              placeholder="Enter placeholder text"
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
            <Label htmlFor="input-type">Input Type</Label>
            <Select
              value={config.inputType || 'text'}
              onValueChange={(value) => handleInputChange('inputType', value)}
            >
              <SelectTrigger>
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
                    e.target.value ? parseInt(e.target.value) : undefined
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
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pattern">Pattern (Regex)</Label>
            <Input
              id="pattern"
              value={config.pattern || ''}
              onChange={(e) => handleInputChange('pattern', e.target.value)}
              placeholder="^[a-zA-Z0-9]+$"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="autocomplete">Autocomplete</Label>
            <Input
              id="autocomplete"
              value={config.autoComplete || ''}
              onChange={(e) =>
                handleInputChange('autoComplete', e.target.value)
              }
              placeholder="name, email, etc."
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
