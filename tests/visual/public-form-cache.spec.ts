import { expect, test } from "@playwright/test";

test("public form loads its own response when the builder has cached the same form", async ({
	page,
}) => {
	const formId = "public-cache-test";
	const ownerForm = {
		id: formId,
		title: "Cached form",
		fields: {
			pages: [
				{
					id: "page-1",
					sections: [
						{
							id: "section-1",
							fields: [
								{
									id: "name",
									uniqueIdentifier: "text-input",
									label: "Your name",
								},
							],
						},
					],
				},
			],
		},
	};
	const pageErrors: string[] = [];
	let publicRequests = 0;
	page.on("pageerror", (error) => pageErrors.push(error.message));
	await page.route(`**/api/forms/${formId}/viewForm`, (route) => {
		publicRequests += 1;
		return route.fulfill({ json: { ...ownerForm, status: "Active" } });
	});
	await page.goto("/auth", { waitUntil: "networkidle" });
	await page.evaluate(async (ownerForm) => {
		const load = (path: string) => import(/* @vite-ignore */ path);
		const componentPath = "/src/containers/public/forms/[slug]/index.tsx";
		const source = await fetch(componentPath).then((response) => response.text());
		const reactPath = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
		const queryPath = source.match(/from "([^"]*react-query[^"]*)"/)?.[1];
		if (!reactPath || !queryPath) throw new Error("Missing client dependencies");
		const [React, client, query, form] = await Promise.all([
			load(reactPath),
			load("/node_modules/.vite/deps/react-dom_client.js"),
			load(queryPath),
			load(componentPath),
		]);
		const queryClient = new query.QueryClient();
		// The authenticated builder response has no computed public status.
		queryClient.setQueryData(["form", ownerForm.id], ownerForm);
		const host = document.createElement("div");
		document.body.replaceChildren(host);
		const e = React.default.createElement;
		client.default.createRoot(host).render(
			e(
				query.QueryClientProvider,
				{ client: queryClient },
				e(form.default, { slug: ownerForm.id }),
			),
		);
	}, ownerForm);

	await expect(page.getByRole("heading", { name: ownerForm.title })).toBeVisible();
	await page.getByRole("textbox", { name: "Your name" }).fill("Ada");
	await expect(page.getByRole("textbox", { name: "Your name" })).toHaveValue("Ada");
	await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
	expect(publicRequests).toBe(1);
	expect(pageErrors).toEqual([]);
});
