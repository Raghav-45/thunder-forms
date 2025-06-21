import { FieldProps } from '@/components/FormBuilder/types/types'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import { TextAreaConfig } from './types'

const TextArea: React.FC<FieldProps<TextAreaConfig>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      <Textarea
        id={inputId}
        placeholder={field.placeholder}
        value={(value || '') as string}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={field.disabled}
        required={field.required}
        minLength={field.minLength}
        maxLength={field.maxLength}
        autoComplete={field.autoComplete}
        className={error ? 'border-red-500 focus:border-red-500' : ''}
      />

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

export default TextArea
