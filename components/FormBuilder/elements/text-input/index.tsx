import { FieldProps } from '@/components/FormBuilder/types/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'
import { TextInputConfig } from './types'

const TextInput: React.FC<FieldProps<TextInputConfig>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleBlur = () => {
    if (onBlur) {
      onBlur()
    }
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
        type={field.inputType || 'text'}
        placeholder={field.placeholder}
        value={(value || '') as string}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={field.disabled}
        required={field.required}
        minLength={field.minLength}
        maxLength={field.maxLength}
        pattern={field.pattern}
        autoComplete={field.autoComplete}
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

export default TextInput
