import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/containers/dashboard/dashboard-layout'
import Default from '@/containers/dashboard'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DashboardLayout>
      <Default />
    </DashboardLayout>
  )
}
