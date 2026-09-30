import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { serve } from "srvx";
import server from "./dist/server/server.js";

const root = process.cwd();
const clientDir = path.join(root, "dist", "client");
const publicDir = path.join(root, "public");

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8",
};

async function tryFile(dir, pathname) {
	const file = path.normalize(path.join(dir, pathname));
	if (!file.startsWith(dir)) return null;
	try {
		const stat = await fs.stat(file);
		if (!stat.isFile()) return null;
		return { file, stat };
	} catch {
		return null;
	}
}

const fetch = async (request) => {
	const { pathname } = new URL(request.url);
	if (pathname !== "/" && !pathname.startsWith("/api/")) {
		const hit =
			(await tryFile(clientDir, pathname)) ?? (await tryFile(publicDir, pathname));
		if (hit) {
			const ext = path.extname(hit.file).toLowerCase();
			const stream = createReadStream(hit.file);
			return new Response(stream, {
				status: 200,
				headers: {
					"content-type": MIME[ext] ?? "application/octet-stream",
					"content-length": String(hit.stat.size),
					"cache-control": pathname.startsWith("/assets/")
						? "public, max-age=31536000, immutable"
						: "public, max-age=3600",
				},
			});
		}
	}
	return server.fetch(request);
};

const port = Number(process.env.PORT ?? 3000);
serve({ fetch, port });
console.log(`Thunder Forms listening on http://localhost:${port}`);
