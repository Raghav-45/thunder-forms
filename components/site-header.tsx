import Link from 'next/link'

import { cn } from '@/lib/utils'
import { MainNav } from '@/components/mainNav'
import { buttonVariants } from '@/components/ui/button'
import { GithubIcon, TerminalIcon, UserCircle2Icon } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { UserNav } from './user-nav'

export function SiteHeader() {
  const isLoggedIn = true
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div> */}
          <nav className="flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({
                      variant: 'secondary',
                      size: 'sm',
                    }),
                    'mr-1'
                  )}
                >
                  <TerminalIcon className="size-4" />
                  Go to dashboard
                </Link>
                <UserNav />
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className={cn(
                    buttonVariants({
                      variant: 'secondary',
                      size: 'sm',
                    }),
                    'mr-1'
                  )}
                >
                  <UserCircle2Icon className="size-4" />
                  Login
                </Link>
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div
                    className={cn(
                      buttonVariants({
                        variant: 'ghost',
                      }),
                      'w-9 px-0'
                    )}
                  >
                    <GithubIcon className="size-4" />
                    <span className="sr-only">GitHub</span>
                  </div>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
