'use client'

import * as React from 'react'
import { CheckIcon, ClipboardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  value: string // String to copy
}

export function CopyButton({ value }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setHasCopied(true)

    setTimeout(() => {
      setHasCopied(false)
    }, 1000) // Reset after 2 seconds
  }

  return (
    <Button
      onClick={handleCopy}
      variant="secondary"
      size="sm"
      aria-label="Copy"
    >
      {hasCopied ? (
        <>
          <CheckIcon className="h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <ClipboardIcon className="h-4 w-4" /> Copy Link
        </>
      )}
    </Button>
  )
}
