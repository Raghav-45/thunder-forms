import { auth } from "#/lib/auth";

export async function getSessionUserId(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user?.id ?? null;
}
