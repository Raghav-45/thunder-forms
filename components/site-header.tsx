import Link from 'next/link'

import { cn } from '@/lib/utils'
import { MainNav } from '@/components/mainNav'
import { buttonVariants } from '@/components/ui/button'
import { GithubIcon, TerminalIcon, UserCircle2Icon } from 'lucide-react'
import { UserNav } from '@/components/user-nav'

import { createClient } from '@/utils/supabase/server'

export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const isLoggedIn = data?.user
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
                <UserNav isDashboard={false} />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
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
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
