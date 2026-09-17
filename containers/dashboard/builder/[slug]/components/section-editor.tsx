'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { FormSection } from '@/features/form-builder/form-structure'
import { useState } from 'react'

interface SectionEditorProps {
  onClose: () => void
  onUpdate: (section: FormSection) => void
  section: FormSection
}

export function SectionEditor({
  onClose,
  onUpdate,
  section,
}: SectionEditorProps) {
  const [title, setTitle] = useState(section.title ?? '')
  const [description, setDescription] = useState(section.description ?? '')

  const save = () => {
    onUpdate({
      ...section,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="gap-y-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure Section</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter section title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-description">Description</Label>
            <Textarea
              id="section-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter section description"
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
