import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "#/containers/auth";

export const Route = createFileRoute("/auth/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AuthPage />;
}
