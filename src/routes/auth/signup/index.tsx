import SignupPage from '#/containers/auth/signup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/signup/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignupPage />
}
