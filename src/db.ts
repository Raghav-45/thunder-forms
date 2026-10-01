import { PrismaPg } from "@prisma/adapter-pg";

import { getAnalyticsDatabaseUrl, getDatabaseUrl } from "#/database-url.js";
import { PrismaClient } from "#/generated/prisma/client.js";

const adapter = new PrismaPg({
	connectionString: getDatabaseUrl(),
});

declare global {
	var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma;
}

const analyticsAdapter = new PrismaPg({
	connectionString: process.env.ANALYTICS_DATABASE_URL
		? getAnalyticsDatabaseUrl()
		: "postgresql://localhost:5432/analytics_placeholder",
});

declare global {
	var __analyticsPrisma: PrismaClient | undefined;
}

export const analyticsPrisma =
	globalThis.__analyticsPrisma ||
	new PrismaClient({ adapter: analyticsAdapter });

if (process.env.NODE_ENV !== "production") {
	globalThis.__analyticsPrisma = analyticsPrisma;
}
