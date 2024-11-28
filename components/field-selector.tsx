import React from 'react'

import { fieldTypes } from '@/constants'
import { Button } from '@/components/ui/button'
import { GripVerticalIcon } from 'lucide-react'

type FieldSelectorProps = {
  addFormField: (variant: string, index?: number) => void
  onDragStart: (e: React.DragEvent, variant: string, index?: number) => void
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  addFormField,
  onDragStart,
}) => {
  return (
    <div className="flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
      {fieldTypes
        .sort((a, b) => Number(b.isAvaliable) - Number(a.isAvaliable))
        .map((variant) => (
          <div
            className="flex items-center w-full"
            key={`${variant.name}-${variant.index ?? 0}`}
          >
            <Button
              key={variant.name}
              variant="outline"
              onClick={() => addFormField(variant.name, variant.index)}
              onDragStart={(e) => onDragStart(e, variant.name, variant.index)}
              className="rounded-xl w-full"
              size="sm"
              disabled={!variant.isAvaliable}
              draggable
            >
              {variant.name}
              {!variant.isAvaliable && (
                <div className="ml-1 text-[9px] font-bold px-1 bg-blue-400 text-black rounded-full">
                  coming soon
                </div>
              )}
              <GripVerticalIcon className="ml-auto size-4" />
            </Button>
          </div>
        ))}
    </div>
  )
}
