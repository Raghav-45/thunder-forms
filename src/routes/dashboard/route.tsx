import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const session = await auth.api.getSession({
		headers: getRequestHeaders(),
	});
	return session;
});

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location }) => {
		// Mirrors ORIG proxy.ts: public builder for new forms stays accessible
		// without a session; every other /dashboard* route requires auth.
		if (location.pathname.startsWith("/dashboard/builder/new-form")) return;
		const session = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/auth" });
		}
	},
});
