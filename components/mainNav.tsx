'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'
import { ZapIcon } from 'lucide-react'
import { siteConfig } from '@/config/site'

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <div className="text-2xl">⚡</div>
        <span className="font-semibold text-lg">{siteConfig.name}</span>
      </Link>
      <nav className="ml-6 flex items-center gap-4 text-sm lg:gap-6">
        <Link
          href="/dashboard/forms/new-form"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/forms/new-form')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Build a form
        </Link>
        <Link
          href="/templates"
          className={cn(
            'transition-colors hover:text-foreground/80 flex',
            pathname?.startsWith('/templates')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Templates{' '}
          {!pathname?.startsWith('/templates') && (
            <Badge
              variant="outline"
              className="ml-1 bg-blue-500 px-1.5 py-0.5 text-blue-100 align-middle text-xs leading-none"
            >
              new
            </Badge>
          )}
          {/* {!pathname?.startsWith('/templates') && (
            <span className="ml-2 rounded-md bg-[#FFBD7A] px-1.5 font-semibold text-xs leading-none text-black">
              new
            </span>
          )} */}
        </Link>
        <Link
          href="/pricing"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/pricing')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Pricing
        </Link>
      </nav>
    </div>
  )
}
