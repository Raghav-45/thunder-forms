import { LoginForm } from '@/components/login-form'
import { Icons } from '@/components/Icons'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh h-full w-full justify-center md:items-center md:bg-gradient-to-r md:from-blue-400 md:to-purple-700">
      <div className="grid w-full lg:grid-cols-2 md:aspect-video md:rounded-3xl overflow-hidden md:w-[1200px]">
        <div className="hidden md:flex h-full flex-col bg-muted p-10 bg-neutral-900 text-white dark:border-r">
          <div className="flex items-center text-2xl font-medium align-center text-center">
            <Icons.ThunderFormsLogo className="h-auto w-8 mr-2" />
            Thunder Forms
          </div>
          <div className="mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg italic">
                &ldquo;Thunder Forms has saved me countless hours of work and
                helped me deliver stunning forms effortlessly. It became my
                go-to tool for building forms quickly and efficiently.&rdquo;
              </p>
              <p className="text-sm">- Aditya</p>
            </blockquote>
          </div>
        </div>
        <div className="flex flex-col h-full w-full bg-background gap-4 p-6">
          <div className="top-0 flex flex-row space-x-4 justify-between w-full">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'hidden md:flex flex-row'
              )}
            >
              <ChevronLeftIcon className="size-4 mr-1" />
              Back
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
