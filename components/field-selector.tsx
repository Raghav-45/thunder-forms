import React from 'react'

import { fieldTypes } from '@/constants'
import { Button } from '@/components/ui/button'
// import If from '@/components/ui/if'
// import Link from 'next/link'
import { GripVerticalIcon } from 'lucide-react'

type FieldSelectorProps = {
  addFormField: (variant: string, index?: number) => void
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  addFormField,
}) => {
  return (
    <div className="flex md:flex-col items-start flex-wrap md:flex-nowrap gap-y-2 overflow-y-auto w-full">
      {fieldTypes.map((variant) => (
        <div className="flex items-center w-full" key={variant.name}>
          <Button
            key={variant.name}
            variant="outline"
            onClick={() => addFormField(variant.name, variant.index)}
            className="rounded-xl w-full"
            size="sm"
          >
            {variant.name}
            {variant.isAvaliable && (
              <div className="ml-1 text-[9px] font-bold px-1 bg-blue-400 text-black rounded-full">
                coming soon
              </div>
            )}
            <GripVerticalIcon className="ml-auto size-4" />
          </Button>
        </div>
      ))}
      {/* <Link href="https://shadcnform.featurebase.app/" target="_blank">
        <Button className="rounded-full" size="sm">
          Request
        </Button>
      </Link> */}
    </div>
  )
}
