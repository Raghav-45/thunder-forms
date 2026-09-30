import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "#/db";

const trustedOrigins = [
	process.env.BETTER_AUTH_URL,
	...(process.env.NODE_ENV !== "production"
		? ["http://localhost:3000", "http://localhost:3001"]
		: []),
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	user: {
		additionalFields: {
			displayName: {
				type: "string",
				required: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Idempotent: retries or duplicate hook runs must not orphan or
					// crash signup when the profile row already exists.
					await prisma.profiles.upsert({
						where: { id: user.id },
						update: {
							email: user.email,
							display_name: (user.displayName as string) || user.name,
						},
						create: {
							id: user.id,
							email: user.email,
							display_name: (user.displayName as string) || user.name,
						},
					});
				},
			},
		},
	},
	plugins: [tanstackStartCookies()],
});
