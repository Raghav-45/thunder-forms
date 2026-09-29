import Default from '@/containers/dashboard/templates'
import { DashboardLayout } from '@/containers/dashboard/dashboard-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/templates/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DashboardLayout>
      <Default />
    </DashboardLayout>
  )
}
