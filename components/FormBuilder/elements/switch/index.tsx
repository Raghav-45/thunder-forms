'use client'

import { FieldProps } from '@/components/FormBuilder/types/types'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import React from 'react'
import { SwitchConfig } from './types'

export const SwitchField: React.FC<FieldProps<SwitchConfig>> = ({
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
      <div className="flex items-center space-x-2">
        <Switch
          id={field.id}
          checked={(value as boolean) || false}
          onCheckedChange={handleSwitchChange}
          disabled={field.disabled}
          aria-label={field.label}
          tabIndex={0}
        />
        <Label
          htmlFor={field.id}
          className={`text-sm font-medium ${
            field.disabled ? 'opacity-50' : 'cursor-pointer'
          }`}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>

      {field.checkedLabel && field.uncheckedLabel && (
        <div className="text-xs text-muted-foreground ml-6">
          {value ? field.checkedLabel : field.uncheckedLabel}
        </div>
      )}

      {field.description && (
        <p className="text-sm text-muted-foreground ml-6">
          {field.description}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 ml-6" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default SwitchField
