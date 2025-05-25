import React, { useState } from 'react'
import { motion } from 'framer-motion'

import { fieldTypes } from '@/constants'
import { Button } from '@/components/ui/button'
import { GripVerticalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type FieldSelectorProps = {
  addFormField: (variant: string) => void
  onDragStart: (e: React.DragEvent, variant: string) => void
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  addFormField,
  onDragStart,
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const handleDragStart = (e: React.DragEvent, variant: string) => {
    setDraggedItem(variant)
    onDragStart(e, variant)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  return (    <div className="grid grid-cols-2 gap-2 md:flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
      {[...fieldTypes]
        .sort((a, b) => Number(b.isAvaliable) - Number(a.isAvaliable))
        .map((variant) => (          <motion.div
            className="flex items-center w-full"
            key={variant.name}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: draggedItem === variant.name ? 0.5 : 1,
              scale: draggedItem === variant.name ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Button
              key={variant.name}
              variant="outline"
              onClick={() => addFormField(variant.name)}
              onDragStart={(e) => handleDragStart(e, variant.name)}
              onDragEnd={handleDragEnd}
              className={cn(
                "rounded-xl w-full px-2 md:pl-3 transition-all duration-200",
                draggedItem === variant.name && "cursor-grabbing",
                variant.isAvaliable 
                  ? "hover:bg-primary/10 hover:border-primary/20 hover:shadow-md" 
                  : "opacity-60"
              )}
              size="sm"
              disabled={!variant.isAvaliable}
              draggable={variant.isAvaliable}
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
                <motion.div
                  animate={{
                    rotate: draggedItem === variant.name ? 15 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <GripVerticalIcon className="size-4" />
                </motion.div>
              </div>
            </Button>
          </motion.div>
        ))}
    </div>
  )
}
