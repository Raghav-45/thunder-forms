import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/healthcheck")({
	server: {
		handlers: {
			GET: async () => {
				// Simulating some basic checks
				const checks = {
					status: "healthy",
					timestamp: new Date().toISOString(),
					uptime: process.uptime(),
					environment: process.env.NODE_ENV,
				};

				return Response.json(checks, { status: 200 });
			},
		},
	},
});
