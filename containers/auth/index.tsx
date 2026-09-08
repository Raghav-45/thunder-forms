import { GalleryVerticalEnd } from 'lucide-react'
import { LoginForm } from './components/login-form'
import Layout from './layout'

export default function AuthPage() {
  return (
    <Layout
      logo={
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
      }
    >
      <LoginForm />
    </Layout>
  )
}
