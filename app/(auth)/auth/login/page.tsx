import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/Icons'
import { login } from '@/app/(auth)/auth/actions'
import { ContinueWithGithubButton } from '@/components/OAuthButtons'

export default function LoginPage() {
  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="hidden md:block text-2xl font-bold">
          Login to your account
        </h1>
        <h1 className="flex md:hidden text-xl font-semibold items-center">
          Login to
          <Icons.ThunderFormsLogo className="size-6 mx-2" />
          Thunder Forms
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="supersecretpassword"
            required
          />
        </div>
        <Button type="submit" formAction={login} className="w-full">
          Login
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <ContinueWithGithubButton />
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <a href="/auth/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  )
}
