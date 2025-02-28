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
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
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
              className="rounded-xl w-full px-2 md:pl-3"
              size="sm"
              disabled={!variant.isAvaliable}
              draggable
            >
              <div className="overflow-hidden truncate text-[0.625rem] md:text-xs">
                {variant.name}
              </div>
              {!variant.isAvaliable && (
                <div className="hidden md:block ml-1 text-[9px] font-bold px-1 bg-blue-400 text-black rounded-full">
                  coming soon
                </div>
              )}
              <div className="ml-auto flex flex-row">
                {!variant.isAvaliable && (
                  <div className="block md:hidden mx-1 right-0 text-[9px] font-bold px-1 bg-blue-400 text-black rounded-full">
                    soon
                  </div>
                )}
                <GripVerticalIcon className="size-4" />
              </div>
            </Button>
          </div>
        ))}
    </div>
  )
}
