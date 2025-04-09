import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/Icons'
import { signup } from '@/app/(auth)/auth/actions'
import { ContinueWithGithubButton } from '@/components/OAuthButtons'

export default function SignUpPage() {
  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="hidden md:block text-2xl font-bold">
          Create an account
        </h1>
        <h1 className="flex md:hidden text-xl font-semibold items-center">
          Join
          <Icons.ThunderFormsLogo className="size-6 mx-2" />
          Thunder Forms
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="supersecretpassword"
            required
          />
        </div>
        <Button type="submit" formAction={signup} className="w-full">
          Sign Up
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <ContinueWithGithubButton />
      </div>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <a href="/auth/login" className="underline underline-offset-4">
          Login
        </a>
      </div>
    </form>
  )
}
