import { createFileRoute } from "@tanstack/react-router";
import PublicFormPage from "#/containers/public/forms/[slug]";

export const Route = createFileRoute("/forms/$slug/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <PublicFormPage slug={Route.useParams().slug} />;
}
