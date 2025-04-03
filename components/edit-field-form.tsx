import React, { useState, useEffect } from 'react'
import * as Locales from 'date-fns/locale'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cross2Icon } from '@radix-ui/react-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import {
  Accordion as SwitchAccordion,
  AccordionContent as SwitchAccordionContent,
  AccordionItem as SwitchAccordionItem,
  AccordionTrigger as SwitchAccordionTrigger,
} from './switch-accordion'

type EditFieldFormProps = {
  isOpen: boolean
  onClose: () => void
  field: FormFieldType | null
  onEditingField: (editedField: FormFieldType | null) => void
  // onSave: (updatedField: FormFieldType) => void
}

export const EditFieldForm: React.FC<EditFieldFormProps> = ({
  isOpen,
  onClose,
  field,
  onEditingField,
  // onSave,
}) => {
  const [editedField, setEditedField] = useState<FormFieldType | null>(null)

  useEffect(() => {
    setEditedField(field)
  }, [field])

  useEffect(() => {
    onEditingField(editedField)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedField])

  if (!editedField) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* <SheetTrigger>Open</SheetTrigger> */}
      <SheetContent side="right" isClosable={false} className="w-80">
        <SheetHeader>
          <div className="flex flex-row justify-between">
            <SheetTitle>Edit {editedField.variant} Field</SheetTitle>
            <SheetClose
              className="!mt-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
              onClick={() => onEditingField(editedField)}
            >
              <Cross2Icon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
          <SheetDescription>
            No need to save manually, your updates are auto-saved!
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-3 mb-4" />

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="flex flex-col gap-y-4">
            <Accordion type="multiple" defaultValue={['basic']}>
              <AccordionItem value="basic">
                <AccordionTrigger className="text-base">
                  Basic Properties
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-y-2">
                  <div>
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      value={editedField.label}
                      onChange={(e) =>
                        setEditedField({
                          ...editedField,
                          label: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/* <div>
                    <Label htmlFor="label">Description</Label>
                    <Input
                      id="description"
                      value={editedField.description}
                      onChange={(e) =>
                        setEditedField({
                          ...editedField,
                          description: e.target.value,
                        })
                      }
                    />
                  </div> */}
                  <SwitchAccordion type="single" collapsible>
                    <SwitchAccordionItem value="item-1">
                      <SwitchAccordionTrigger>
                        Description
                      </SwitchAccordionTrigger>
                      <SwitchAccordionContent>
                        <Input
                          id="description"
                          value={editedField.description}
                          onChange={(e) =>
                            setEditedField({
                              ...editedField,
                              description: e.target.value,
                            })
                          }
                        />
                      </SwitchAccordionContent>
                    </SwitchAccordionItem>
                  </SwitchAccordion>
                  {field?.variant !== 'Switch' && (
                    // <div>
                    //   <Label htmlFor="placeholder">Placeholder</Label>
                    //   <Input
                    //     id="placeholder"
                    //     value={editedField.placeholder}
                    //     onChange={(e) =>
                    //       setEditedField({
                    //         ...editedField,
                    //         placeholder: e.target.value,
                    //       })
                    //     }
                    //   />
                    // </div>
                    <SwitchAccordion type="single" collapsible>
                      <SwitchAccordionItem value="item-1">
                        <SwitchAccordionTrigger>
                          Placeholder
                        </SwitchAccordionTrigger>
                        <SwitchAccordionContent>
                          <Input
                            id="placeholder"
                            value={editedField.placeholder}
                            onChange={(e) =>
                              setEditedField({
                                ...editedField,
                                placeholder: e.target.value,
                              })
                            }
                          />
                        </SwitchAccordionContent>
                      </SwitchAccordionItem>
                    </SwitchAccordion>
                  )}
                  {field?.variant === 'Checkbox' && (
                    <div className="col-span-1 flex items-end gap-1 p-3 rounded">
                      <Checkbox
                        id="defaultChecked"
                        checked={editedField.checked}
                        onCheckedChange={(checked) =>
                          setEditedField({
                            ...editedField,
                            checked: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="defaultChecked">Default Checked?</Label>
                    </div>
                  )}
                  {/* <div>
                    <Label htmlFor="label">Name</Label>
                    <Input
                      id="name"
                      type={field?.type}
                      value={editedField.name}
                      onChange={(e) =>
                        setEditedField({ ...editedField, name: e.target.value })
                      }
                    />
                  </div> */}
                  {field?.variant === 'Input' && (
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        // id="type"
                        value={editedField.type}
                        onValueChange={(value) => {
                          setEditedField({ ...editedField, type: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {editedField.type === 'number' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-1 flex flex-col gap-1">
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
                      <div className="col-span-1 flex flex-col gap-1">
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
                  )}
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex items-center gap-3 w-full justify-end">
              <div className="flex items-center gap-1 border px-3 py-2 rounded w-full">
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
              <div className="flex items-center gap-1 border px-3 py-2 rounded w-full">
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
      </SheetContent>
    </Sheet>
  )
}