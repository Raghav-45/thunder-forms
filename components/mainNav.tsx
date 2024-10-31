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
        <ZapIcon className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <nav className="ml-6 flex items-center gap-4 text-sm lg:gap-6">
        {/* <Link
          href="/docs"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/docs" ? "text-foreground" : "text-foreground/60"
          )}
        >
          Docs
        </Link> */}
        <Link
          href="/examples"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/examples')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Examples
        </Link>
        <Link
          href="/templates"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/templates')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Templates{' '}
          {!pathname?.startsWith('/templates') && (
            <Badge
              variant="outline"
              className="ml-1 border-emerald-400 px-1.5 py-0 text-emerald-400"
            >
              new
            </Badge>
          )}
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
