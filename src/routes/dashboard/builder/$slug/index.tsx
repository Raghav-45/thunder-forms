import { createFileRoute } from "@tanstack/react-router";
import BuilderPage from "@/containers/dashboard/builder/[slug]";

export const Route = createFileRoute("/dashboard/builder/$slug/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <BuilderPage slug={Route.useParams().slug} />;
}
