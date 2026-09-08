import { Icons } from '@/components/Icons'
import { LoginForm } from '../components/login-form'
import { AuthLayout } from '../auth-layout'

export default function LoginPage() {
  return (
    <AuthLayout logo={<Icons.Logo className="size-6" />}>
      <LoginForm />
    </AuthLayout>
  )
}
