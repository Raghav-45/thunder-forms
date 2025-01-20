'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { usePathname } from 'next/navigation'

export default function Loading() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(13)
  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProgress(true)
    }, 500)

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        return prevProgress + 10
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (pathname == '/dashboard') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <div className="text-3xl mb-6 font-semibold animate-pulse">
          ⚡ Thunder Forms
        </div>

        {showProgress && (
          <div className="w-72 space-y-3">
            <Progress value={progress} className="h-1.5 w-full" />
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}
