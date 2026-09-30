import { createFileRoute } from "@tanstack/react-router";
import Default from "@/containers/dashboard";
import { DashboardLayout } from "@/containers/dashboard/dashboard-layout";

export const Route = createFileRoute("/dashboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DashboardLayout>
			<Default />
		</DashboardLayout>
	);
}
