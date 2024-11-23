import React, { useState, useEffect } from 'react'
import * as Locales from 'date-fns/locale'

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog'
// import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FormFieldType } from '@/types/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select' // Import Select components
import { CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { XIcon } from 'lucide-react'
import { Button } from './ui/button'

type EditFieldFormProps = {
  // isOpen: boolean
  // onClose: () => void
  field: FormFieldType | null
  onDismiss: () => void
  onEditingField: (editedField) => void
  // onSave: (updatedField: FormFieldType) => void
}

export const EditFieldForm: React.FC<EditFieldFormProps> = ({
  // isOpen,
  // onClose,
  field,
  onDismiss,
  onEditingField,
  // onSave,
}) => {
  const [editedField, setEditedField] = useState<FormFieldType | null>(null)
  const [fieldType, setFieldType] = useState<string>()

  useEffect(() => {
    setEditedField(field)
  }, [field])

  useEffect(() => {
    onEditingField(editedField)
  }, [editedField])

  // const handleSave = () => {
  //   if (editedField) {
  //     onSave(editedField)
  //     // onClose()
  //   }
  // }

  if (!editedField) return null

  return (
    <CardContent className="p-6">
      <div className="flex flex-row justify-between">
        <h2 className="text-2xl font-bold mb-4">
          Edit {editedField.variant} Field
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onDismiss()
            onEditingField(editedField)
          }}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <Separator className="my-4" />
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="flex flex-col gap-y-2">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={editedField.label}
              onChange={(e) =>
                setEditedField({ ...editedField, label: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="label">Description</Label>
            <Input
              id="description"
              value={editedField.description}
              onChange={(e) =>
                setEditedField({ ...editedField, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={editedField.placeholder}
              onChange={(e) =>
                setEditedField({ ...editedField, placeholder: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="className">className</Label>
            <Input
              id="className"
              value={editedField.className}
              onChange={(e) =>
                setEditedField({ ...editedField, className: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="label">Name</Label>
            <Input
              id="name"
              type={field?.type}
              value={editedField.name}
              onChange={(e) =>
                setEditedField({ ...editedField, name: e.target.value })
              }
            />
          </div>
          {field?.variant === 'Input' && (
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                // id="type"
                value={editedField.type}
                onValueChange={(value) => {
                  setFieldType(value)
                  setEditedField({ ...editedField, type: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {fieldType === 'number' ||
            (fieldType === 'text' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 flex flex-col gap-1 ">
                  <Label>Min Value</Label>
                  <Input
                    id="min"
                    type="number"
                    value={editedField.min}
                    onChange={(e) =>
                      setEditedField({
                        ...editedField,
                        min: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1 ">
                  <Label>Max Value</Label>
                  <Input
                    id="max"
                    type="number"
                    value={editedField.max}
                    onChange={(e) =>
                      setEditedField({
                        ...editedField,
                        max: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          {field?.variant === 'Slider' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 flex flex-col gap-1 ">
                <Label>Min Value</Label>
                <Input
                  id="min"
                  type="number"
                  value={editedField.min}
                  onChange={(e) =>
                    setEditedField({
                      ...editedField,
                      min: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="col-span-1 flex flex-col gap-1 ">
                <Label>Max Value</Label>
                <Input
                  id="max"
                  type="number"
                  value={editedField.max}
                  onChange={(e) =>
                    setEditedField({
                      ...editedField,
                      max: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="col-span-1 flex flex-col gap-1 ">
                <Label>Step</Label>
                <Input
                  id="step"
                  type="number"
                  value={editedField.step}
                  onChange={(e) =>
                    setEditedField({
                      ...editedField,
                      step: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}
          {field?.variant === 'Smart Datetime Input' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1 flex flex-col gap-1 ">
                <Label htmlFor="locale">Locale</Label>
                <Select
                  // id="locale"
                  value={editedField.locale ?? ''}
                  onValueChange={(value) => {
                    setEditedField({
                      ...editedField,
                      locale: value as keyof typeof Locales,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locale" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(Locales).map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {locale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 flex items-end gap-1 p-3 rounded">
                <Checkbox
                  // id="hour12"
                  checked={editedField.hour12}
                  onCheckedChange={(checked) =>
                    setEditedField({
                      ...editedField,
                      hour12: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="hour12">12 Hour Clock</Label>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border p-3 rounded">
              <Checkbox
                checked={editedField.required}
                onCheckedChange={(checked) =>
                  setEditedField({
                    ...editedField,
                    required: checked as boolean,
                  })
                }
              />
              <Label>Required</Label>
            </div>
            <div className="flex items-center gap-1 border p-3 rounded">
              <Checkbox
                checked={editedField.disabled}
                onCheckedChange={(checked) =>
                  setEditedField({
                    ...editedField,
                    disabled: checked as boolean,
                  })
                }
              />
              <Label>Disabled</Label>
            </div>
          </div>
        </div>
      </ScrollArea>
    </CardContent>

    // <div className="max-w-xl">
    //   <h2 className="text-2xl font-bold mb-4">
    //     Edit {editedField.variant} Field
    //   </h2>
    //   <div className="py-4 space-y-4">

    //   </div>
    //   {/* <DialogFooter>
    //     <Button onClick={handleSave}>Save changes</Button>
    //   </DialogFooter> */}
    // </div>
  )
}
