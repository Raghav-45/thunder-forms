import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "#/containers/dashboard/dashboard-layout";
import FormAnalyticsPage from "#/containers/dashboard/forms/[formId]/analytics";

export const Route = createFileRoute("/dashboard/forms/$formId/analytics")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DashboardLayout>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col py-4 md:py-6">
						<div className="flex flex-col items-center justify-between gap-y-4 px-4 lg:px-6">
							<div className="flex w-full justify-between items-center">
								<div className="flex flex-col gap-2">
									<h1 className="text-3xl leading-none font-bold">
										Forms Analytics
									</h1>
									<p className="text-muted-foreground text-sm">
										View detailed analytics for your forms, including visitor
										statistics, device/browser usage, and more.
									</p>
								</div>
							</div>
						</div>
						<FormAnalyticsPage />
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
