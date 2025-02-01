import { Metadata } from 'next'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { UserAuthForm } from '@/components/user-auth-form'
import { Icons } from '@/components/Icons'

export const metadata: Metadata = {
  title: 'Thunder Forms - Authentication',
  description:
    'Sign up or log in to start creating and managing your custom forms.',
}

export default function AuthenticationPage() {
  return (
    <div className="align-middle max-h-screen h-screen content-center md:bg-gradient-to-r md:from-blue-400 md:to-purple-700">
      <div className="md:container relative bg-black md:rounded-3xl overflow-hidden grid w-full md:w-[1200px] md:aspect-video flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="hidden md:flex h-full flex-col bg-muted p-10 bg-zinc-900 text-white dark:border-r">
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
        <div className="p-2 md:p-8">
          <Link
            href="/examples/authentication"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'absolute right-4 top-4 md:right-8 md:top-8'
            )}
          >
            Login
          </Link>
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
            </div>
            <UserAuthForm />
            <p className="text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our
              <br />
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
