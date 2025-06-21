'use client'

// Example usage of the Form Builder components
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FIELD_REGISTRY,
  FieldConfig,
  TextInputEditor,
  MultiSelectEditor,
  TextAreaEditor,
} from '@/components/FormBuilder/elements'
import {
  getFieldComponent,
  createDefaultFieldConfig,
  validateFieldConfig,
} from '@/components/FormBuilder/utils/field-registry'
import { validateFormData } from '@/components/FormBuilder/utils/validation'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'

const FormBuilderExample: React.FC = () => {
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddField = (fieldType: avaliableFieldsType) => {
    const newField = createDefaultFieldConfig(fieldType)
    setFields((prev) => [...prev, newField])
  }

  const handleEditField = (field: FieldConfig, index: number) => {
    setEditingField(field)
    setEditingIndex(index)
  }

  const handleUpdateField = (updatedField: FieldConfig) => {
    const configErrors = validateFieldConfig(updatedField)
    if (configErrors.length > 0) {
      console.error('Field configuration errors:', configErrors)
      return
    }

    setFields((prev) =>
      prev.map((field, index) =>
        index === editingIndex ? updatedField : field
      )
    )
    setEditingField(null)
    setEditingIndex(-1)
  }

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFormChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const handleSubmit = () => {
    const validation = validateFormData(fields, formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    console.log('Form submitted successfully:', formData)
    alert('Form submitted! Check console for data.')
  }

  const renderField = (field: FieldConfig, index: number) => {
    const FieldComponent = getFieldComponent(field.type)

    return (
      <div key={field.id} className="relative group">
        <FieldComponent
          field={field}
          value={formData[field.id]}
          onChange={(value) => handleFormChange(field.id, value)}
          error={errors[field.id]}
        />

        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditField(field, index)}
              className="h-8 px-2"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveField(index)}
              className="h-8 px-2 text-red-500 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderEditor = () => {
    if (!editingField) return null

    const commonProps = {
      field: editingField,
      onUpdate: handleUpdateField,
      onClose: () => {
        setEditingField(null)
        setEditingIndex(-1)
      },
      isOpen: true,
    }

    switch (editingField.type) {
      case 'text-input':
        return <TextInputEditor {...commonProps} />
      case 'multi-select':
        return <MultiSelectEditor {...commonProps} />
      case 'text-area':
        return <TextAreaEditor {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Builder Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {AVAILABLE_FIELDS.map((fieldType) => (
              <Button
                key={fieldType}
                onClick={() => handleAddField(fieldType as avaliableFieldsType)}
                variant="outline"
              >
                Add {fieldType}
              </Button>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No fields added yet. Click the buttons above to add form fields.
            </div>
          )}

          <div className="space-y-6">
            {fields.map((field, index) => renderField(field, index))}
          </div>

          {fields.length > 0 && (
            <div className="pt-4 border-t">
              <Button onClick={handleSubmit} className="w-full">
                Submit Form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {renderEditor()}

      {/* Debug Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Form Configuration:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(fields, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Form Data:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

            {Object.keys(errors).length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">
                  Validation Errors:
                </h4>
                <pre className="text-xs bg-red-50 p-3 rounded overflow-auto">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FormBuilderExample
