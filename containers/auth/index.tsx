import { GalleryVerticalEnd } from 'lucide-react'
import { LoginForm } from './components/login-form'
import { AuthLayout } from './auth-layout'

export default function AuthPage() {
  return (
    <AuthLayout
      logo={
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
