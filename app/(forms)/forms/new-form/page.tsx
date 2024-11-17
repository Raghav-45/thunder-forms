'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { fieldTypes } from '@/constants'
import { GripVerticalIcon } from 'lucide-react'

export default function FormBuilder() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Side bar with Form Details */}
      <Card className="w-80 border-l rounded-none h-screen overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Form Details</h2>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formName">Form Name</Label>
            <Input
              id="formName"
              placeholder="Enter form name"
              //   value={formName}
              //   onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              placeholder="Enter description"
              className="max-h-24"
              //   value={formDescription}
              //   onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>Form Link</Label>
            <Input
              readOnly
              //   value={`https://localhost:3000/forms/${
              //     currentFormId ?? 'new-form'
              //   }`}
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="flex-1 p-8 overflow-auto"
        onDragOver={(e) => e.preventDefault()}
        // onDrop={handleDrop}
      >
        <h2 className="text-3xl font-bold mb-6">Form Preview</h2>
        <Card className="min-h-[600px] border-2 border-dashed border-muted">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <p>Drag elements here to build your form</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side bar */}
      <Card className="w-80 border-l rounded-none h-screen overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Elements</h2>
          <Separator className="my-4" />
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {/* {FORM_ELEMENTS_LIBRARY.map((element) => (
                  <DraggableElement
                    key={element.type}
                    type={element.type}
                    label={element.label}
                    icon={element.icon}
                    onDragStart={handleDragStart}
                  />
                ))} */}

            <div className="flex flex-col gap-y-1">
              {fieldTypes.map((variant) => (
                <div className="flex items-center" key={variant.name}>
                  <Button
                    key={variant.name}
                    variant="outline"
                    //   onClick={() => addFormField(variant.name, variant.index)}
                    className="rounded-xl w-full"
                    size="sm"
                  >
                    {variant.name}
                    {variant.isNew && (
                      <div className="ml-1 text-[10px] px-1 bg-blue-300 text-black rounded-full">
                        New
                      </div>
                    )}
                    <GripVerticalIcon className="ml-auto size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {/* <Button
              className="w-full mt-8"
              variant="secondary"
              //   onClick={handlSubmit}
            >
              Save Changes
            </Button> */}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
