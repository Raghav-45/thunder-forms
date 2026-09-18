'use client'

import * as React from 'react'
import { CheckIcon, LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  className?: string
  value: string
}

export function CopyButton({ className, value }: CopyButtonProps) {
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
      aria-label="Copy"
      className={className}
    >
      {hasCopied ? (
        <>
          <CheckIcon className="h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" /> Copy Link
        </>
      )}
    </Button>
  )
}
