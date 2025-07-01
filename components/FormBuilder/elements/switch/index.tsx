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
          <p className="text-sm text-muted-foreground">{field.description}</p>
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

export default SwitchField
