import { Icons } from '@/components/Icons'
import { SignupForm } from '../components/signup-form'
import { AuthLayout } from '../auth-layout'

export default function SignupPage() {
  return (
    <AuthLayout logo={<Icons.Logo className="size-6" />}>
      <SignupForm />
    </AuthLayout>
  )
}
