import { createFileRoute } from "@tanstack/react-router";
import SignupPage from "#/containers/auth/signup";

export const Route = createFileRoute("/auth/signup/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <SignupPage />;
}
