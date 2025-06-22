'use client'

import {
  FieldConfig,
  MultiSelectEditor,
  SwitchEditor,
  TextAreaEditor,
  TextInputEditor,
} from '@/components/FormBuilder/elements'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

// interface FormBuilderElementType {
//   editor: any
//   fieldConfig: FieldConfig
// }

export default function FormBuilderPage() {
  // const [elements, setElements] = useState([])
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)

  const handleAddField = (uniqueIdentifier: avaliableFieldsType) => {
    const newField = createDefaultFieldConfig(uniqueIdentifier)
    setFields((prev) => [...prev, newField])
  }

  const renderField = (field: FieldConfig) => {
    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    const handleRemoveField = (id: string) => {
      setFields((prev) => prev.filter((field) => field.id !== id))
    }

    return (
      <div key={field.id} className="relative group">
        <FieldComponent
          // @ts-expect-error field properties not guaranteed across all variants
          field={field}
          // value={formData[field.id]}
          onChange={(value) => console.log(field.id, value)}
          // error={errors[field.id]}
        />

        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingField(field)}
              className="h-8 px-2"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveField(field.id)}
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
    const field = editingField
    if (!field) return null

    const handleUpdateField = (updatedField: FieldConfig) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === updatedField.id ? { ...field, ...updatedField } : field
        )
      )
      setEditingField(null)
    }

    const baseProps = {
      field,
      onUpdate: handleUpdateField,
      onClose: () => {
        setEditingField(null)
      },
      isOpen: true,
    }

    switch (field.uniqueIdentifier) {
      case 'text-input':
        // @ts-expect-error field properties not guaranteed across all variants
        return <TextInputEditor {...baseProps} />
      case 'multi-select':
        // @ts-expect-error field properties not guaranteed across all variants
        return <MultiSelectEditor {...baseProps} />
      case 'text-area':
        // @ts-expect-error field properties not guaranteed across all variants
        return <TextAreaEditor {...baseProps} />
      case 'switch-field':
        // @ts-expect-error field properties not guaranteed across all variants
        return <SwitchEditor {...baseProps} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col mx-auto p-6 space-y-6">
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
        </CardContent>
      </Card>
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

            <div className="space-y-6">
              {fields.map((field) => renderField(field))}
            </div>
          </div>
        </CardContent>
      </Card>
      {renderEditor()}
    </div>
  )
}
