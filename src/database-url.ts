export function getDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}

	return databaseUrl;
}

export function getAnalyticsDatabaseUrl() {
	const analyticsDatabaseUrl = process.env.ANALYTICS_DATABASE_URL;

	if (!analyticsDatabaseUrl) {
		throw new Error("ANALYTICS_DATABASE_URL is required");
	}

	return analyticsDatabaseUrl;
}
