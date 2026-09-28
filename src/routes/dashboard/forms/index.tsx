import Default from '@/containers/dashboard/forms'
import { DashboardLayout } from '#/containers/dashboard/dashboard-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/forms/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DashboardLayout>
      <Default />
    </DashboardLayout>
  )
}
