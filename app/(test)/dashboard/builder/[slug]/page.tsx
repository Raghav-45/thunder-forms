'use client'

import { CopyButton } from '@/components/copy-button'
import { DatePickerWithPresets } from '@/components/date-picker-with-presets'
import GenerateWithAiPrompt from '@/components/FormBuilder/core/generate-with-ai'
import {
  FieldConfig,
  MultiSelectEditor,
  SwitchEditor,
  TextAreaEditor,
  TextInputEditor,
} from '@/components/FormBuilder/elements'
import { useFormStore } from '@/components/FormBuilder/store'
import {
  AVAILABLE_FIELDS,
  avaliableFieldsType,
} from '@/components/FormBuilder/types/types'
import {
  createDefaultFieldConfig,
  getFieldComponent,
} from '@/components/FormBuilder/utils/helperFunctions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import {
  GripVerticalIcon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { use, useState } from 'react'

// interface FormBuilderElementType {
//   editor: any
//   fieldConfig: FieldConfig
// }

interface FormBuilderProps {
  params: Promise<{ slug: string }>
}

export default function FormBuilderPage({ params }: FormBuilderProps) {
  const { formSettings, setFormSettings } = useFormStore()
  const { slug: currentFormId } = use(params)
  // const [elements, setElements] = useState([])
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)

  const handleAddField = (uniqueIdentifier: avaliableFieldsType) => {
    const newField = createDefaultFieldConfig(uniqueIdentifier)
    setFields((prev) => [...prev, newField])
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderField = (field: FieldConfig) => {
    const FieldComponent = getFieldComponent(field.uniqueIdentifier)

    const handleRemoveField = (id: string) => {
      setFields((prev) => prev.filter((field) => field.id !== id))
    }

    return (
      <div key={field.id} className="relative group">
        <div className="w-full pr-28">
          <FieldComponent
            // @ts-expect-error field properties not guaranteed across all variants
            field={field}
            // value={formData[field.id]}
            onChange={(value) => console.log(field.id, value)}
            // error={errors[field.id]}
          />
        </div>

        <div className="absolute right-0 bottom-0 space-x-2 mr-4 transition-opacity">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="cursor-pointer hover:bg-neutral-800!"
              onClick={() => setEditingField(field)}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              className="cursor-pointer bg-neutral-900! hover:bg-neutral-800!"
              onClick={() => handleRemoveField(field.id)}
            >
              <Trash2Icon />
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
    <div className="flex bg-background h-screen text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="hidden md:block border-0 border-r-2 rounded-none w-80 h-screen overflow-hidden">
        <CardContent className="flex flex-col space-y-4 p-4 py-0 h-full">
          <div className="flex flex-row justify-between mb-8">
            <h2 className="font-bold text-2xl">Settings</h2>

            <Button
              size="sm"
              variant="secondary"
              // onClick={handleSaveForm}
              // disabled={isFormSaving}
              className="text-xs"
            >
              {/* {isFormSaving ? (
                <Loader2Icon className="animate-spin" />
              ) : ( */}
              <SaveIcon /> Save
              {/* )}{' '}
              {isFormSaving ? 'Saving...' : 'Save'} */}
            </Button>
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="formName">Form Title</Label>
            <Input
              id="formName"
              placeholder="Enter form name"
              value={formSettings.title}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  title: e.target.value,
                })
              }
              className="bg-neutral-900!"
            />
          </div>
          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="formDescription">Form Description</Label>
            <Textarea
              id="formDescription"
              placeholder="Enter description"
              className="max-h-24 bg-neutral-900!"
              value={formSettings.description}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="py-2">
            <Separator />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="expiresAt">Expiration Date</Label>
            <DatePickerWithPresets
              date={formSettings.expiresAt || null}
              setDate={(e) =>
                setFormSettings({
                  ...formSettings,
                  expiresAt: e || undefined,
                })
              }
              className="bg-neutral-900!"
            />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="maxSubmission">Max Submission Limit</Label>
            <Input
              id="maxSubmission"
              type="number"
              placeholder="Enter max value (optional)"
              value={formSettings.maxSubmissions}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  maxSubmissions: parseInt(e.target.value),
                })
              }
              className="bg-neutral-900!"
            />
          </div>

          <div className="items-center gap-1.5 grid w-full">
            <Label htmlFor="redirectUrl">Redirect URL</Label>
            <Input
              id="redirectUrl"
              type="url"
              placeholder="https://example.com (optional)"
              value={formSettings.redirectUrl}
              onChange={(e) =>
                setFormSettings({
                  ...formSettings,
                  redirectUrl: e.target.value,
                })
              }
              className="bg-neutral-900!"
            />
          </div>

          {/* This div will push the content below it to the bottom */}
          <div className="flex-grow"></div>

          {/* This will now be at the bottom */}
          <GenerateWithAiPrompt
            onGeneratedFields={(title, description, fields) => {
              setFormSettings({
                ...formSettings,
                title,
                description,
              })
              setFields(fields)
            }}
          />
        </CardContent>
      </Card>

      <ScrollArea
        className="flex-1 p-4 md:p-4 pt-6 overflow-auto"
        // onDragOver={(e) => e.preventDefault()}
        // onDrop={handleDrop}
      >
        <div className="flex flex-row justify-between">
          <h2 className="mb-6 font-bold text-3xl">Builder</h2>

          <div className="flex flex-row gap-x-2">
            {currentFormId !== 'new-form' && (
              <CopyButton value={`${siteConfig.url}/forms/${currentFormId}`} />
            )}
          </div>
        </div>
        <Card
          className={cn(
            'min-h-[600px] border-2 border-dashed !p-0 border-muted',
            !(fields.length > 0) && 'content-center'
          )}
        >
          <CardContent className="p-3 md:p-4">
            {fields.length > 0 ? (
              <div>
                <div className="space-y-6">
                  {fields.map((field) => renderField(field))}
                </div>
                <h4 className="font-medium mb-2">Form Configuration:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(fields, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground text-center">
                <p>Drag elements here to build your form or Generate with AI</p>
              </div>
            )}
            {/* )} */}
          </CardContent>
        </Card>
      </ScrollArea>

      <>
        <Card className="hidden md:block border-0 border-l-2 rounded-none w-80 h-screen overflow-hidden">
          <CardContent className="p-4 pt-0">
            <h2 className="font-bold text-2xl">Available Fields</h2>
            <CardDescription>
              Select fields from the list to add
            </CardDescription>
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="flex flex-row">
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
                  {AVAILABLE_FIELDS.concat(comingSoonElements).map(
                    (fieldType) => (
                      <Button
                        key={fieldType}
                        onClick={() =>
                          handleAddField(fieldType as avaliableFieldsType)
                        }
                        variant="outline"
                        className="rounded-lg w-full px-2 md:pl-3 bg-neutral-900!"
                        size="sm"
                        disabled={!AVAILABLE_FIELDS.includes(fieldType)}
                      >
                        <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                          {fieldType}
                        </div>
                        {!AVAILABLE_FIELDS.includes(fieldType) && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold mx-1 px-1 bg-blue-400 text-black rounded-full py-0"
                          >
                            coming soon
                          </Badge>
                        )}
                        <div className="ml-auto flex flex-row">
                          <GripVerticalIcon className="size-4" />
                        </div>
                      </Button>
                    )
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {renderEditor()}
        {/* <EditFieldForm
            isOpen={isEditingWindowOpen}
            onClose={() => setIsEditingWindowOpen(false)}
            field={selectedField}
            onEditingField={(editedField) => {
              handleSaveField(editedField!)
            }}
          /> */}
      </>
    </div>
  )
}

const comingSoonElements = [
  'Combobox',
  'Date Picker',
  'Datetime Picker',
  'File Input',
  'Input OTP',
  'Location Input',
  'Multi Select',
  'Password',
  'Phone',
  'Select',
  'Signature Input',
  'Slider',
  'Smart Datetime Input',
  'Tags Input',
]
