import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";
import TemplatesPage from "#/containers/templates";

export const Route = createFileRoute("/templates/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<TemplatesPage />
			</main>
			<SiteFooter />
		</>
	);
}
