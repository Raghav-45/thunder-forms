'use client'

import { signup } from '@/app/(auth)/auth/actions'
import { ContinueWithOAuthButtonsGroup } from '@/components/OAuthButtons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [isLoading, setIsLoading] = useState(false)

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   setIsLoading(true)

  //   try {
  //     await signup(new FormData(e.currentTarget))
  //   } catch (error) {
  //     console.error('Signup error:', error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const AuthCredentialsValidator = z.object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password must be at least 1 characters long'),
  })

  type TAuthCredentials = z.infer<typeof AuthCredentialsValidator>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TAuthCredentials>({
    resolver: zodResolver(AuthCredentialsValidator),
  })

  const onSubmit = async ({
    displayName,
    email,
    password,
  }: TAuthCredentials) => {
    setIsLoading(true)

    const result = await signup({ displayName, email, password })

    // Check if we got an error result
    if (result && result.success) {
      toast.success('Account created! Welcome to ThunderForms ⚡️')
    } else if (result && !result.success) {
      switch (result.error.message) {
        case 'User already registered':
          toast.error('An account with this email already exists')
          break
        case 'Too many requests':
          toast.error('Too many sign-up attempts. Please wait and try later.')
          break
        default:
          toast.error('Signup failed. Something went wrong.')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your Github or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <ContinueWithOAuthButtonsGroup />
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    {...register('displayName')}
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                    className={cn({ 'border-red-500': errors.email })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register('email')}
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                    className={cn({ 'border-red-500': errors.email })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    {...register('password')}
                    type="password"
                    required
                    disabled={isLoading}
                    className={cn({ 'border-red-500': errors.email })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? 'Creating account...' : 'Sign up'}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <a href="/auth/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}
