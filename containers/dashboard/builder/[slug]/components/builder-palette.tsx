import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AVAILABLE_FIELDS,
  type avaliableFieldsType,
} from '@/features/form-builder/types/types'
import { cn } from '@/lib/utils'
import { GripVerticalIcon } from 'lucide-react'
import { memo } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'

import { PALETTE_FIELD_TYPE, PALETTE_SECTION_TYPE } from '../drag-model'

const COMING_SOON_FIELDS = [
  'Combobox',
  'File Input',
  'Input OTP',
  'Location Input',
  'Password',
  'Phone',
  'Signature Input',
]

const PALETTE = AVAILABLE_FIELDS.map((fieldType, index) => ({
  id: `builder-palette-${fieldType}-${index}`,
  fieldType: fieldType as avaliableFieldsType,
}))

const PaletteFieldRow = memo(function PaletteFieldRow({
  fieldType,
  id,
  onAdd,
}: {
  fieldType: avaliableFieldsType
  id: string
  onAdd: (fieldType: avaliableFieldsType) => void
}) {
  const { isDragSource, ref } = useSortable({
    id,
    group: 'builder-palette',
    accept: () => false,
    type: PALETTE_FIELD_TYPE,
    index: PALETTE.findIndex((item) => item.id === id),
    data: { fieldType },
  })

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-full cursor-grab rounded-lg bg-neutral-900! px-2 md:pl-3',
        isDragSource && 'opacity-30',
      )}
      onClick={() => onAdd(fieldType)}
    >
      <span className="overflow-hidden truncate text-[0.625rem] md:text-xs">
        {fieldType}
      </span>
      <GripVerticalIcon className="ml-auto size-4" />
    </button>
  )
})

const PaletteSectionRow = memo(function PaletteSectionRow({
  onAdd,
}: {
  onAdd: () => void
}) {
  const { isDragSource, ref } = useSortable({
    id: 'builder-palette-section',
    group: 'builder-palette',
    accept: () => false,
    type: PALETTE_SECTION_TYPE,
    index: 0,
  })

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-full cursor-grab rounded-lg bg-neutral-900! px-2 md:pl-3',
        isDragSource && 'opacity-30',
      )}
      onClick={onAdd}
    >
      <span className="flex flex-1 items-center gap-2 text-left text-[0.625rem] md:text-xs">
        <GripVerticalIcon className="size-4" />
        Section
      </span>
      <span className="text-muted-foreground">Add</span>
    </button>
  )
})

interface BuilderPaletteProps {
  onAddField: (fieldType: avaliableFieldsType) => void
  onAddSection: () => void
}

export function BuilderPalette({
  onAddField,
  onAddSection,
}: BuilderPaletteProps) {
  return (
    <Card className="hidden h-screen w-80 overflow-hidden rounded-none border-0 border-l-2 md:block">
      <CardContent className="p-4 pt-0">
        <h2 className="text-2xl font-bold">Available Fields</h2>
        <CardDescription>
          Drag to place, or click to add to first section.
        </CardDescription>
        <Separator className="my-4" />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="flex flex-row">
            <div className="grid w-full grid-cols-2 flex-wrap items-start gap-2 gap-y-2 overflow-y-auto md:flex md:flex-col md:flex-nowrap">
              <p className="col-span-2 mb-1 text-xs font-medium text-muted-foreground md:w-full">
                Layout
              </p>
              <PaletteSectionRow onAdd={onAddSection} />
              <Separator className="col-span-2 my-2 md:w-full" />
              <p className="col-span-2 mb-1 text-xs font-medium text-muted-foreground md:w-full">
                Fields
              </p>
              {PALETTE.map((entry) => (
                <PaletteFieldRow
                  key={entry.id}
                  id={entry.id}
                  fieldType={entry.fieldType}
                  onAdd={onAddField}
                />
              ))}
              <Separator className="col-span-2 my-2 md:w-full" />
              {COMING_SOON_FIELDS.map((fieldType) => (
                <Button
                  key={fieldType}
                  variant="outline"
                  className="w-full cursor-not-allowed rounded-lg bg-neutral-900! px-2 opacity-60 md:pl-3"
                  size="sm"
                  disabled
                >
                  <span className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                    {fieldType}
                  </span>
                  <Badge
                    variant="outline"
                    className="mx-1 rounded-full bg-blue-400 px-1 py-0 text-[9px] font-bold text-black"
                  >
                    coming soon
                  </Badge>
                  <GripVerticalIcon className="ml-auto size-4" />
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
