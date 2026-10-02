import { expect, type Page, test } from "@playwright/test";

/** Test real client components in isolation; do not alter auth or persist forms. */
async function mount(page: Page, surface: "gallery" | "slider") {
	await page.goto("/auth", { waitUntil: "networkidle" });
	await page.evaluate(async (surface) => {
		const load = (path: string) => import(/* @vite-ignore */ path);
		const rendererSource = await fetch(
			"/src/features/form-builder/elements/fields/slider.tsx",
		).then((response) => response.text());
		const reactPath = rendererSource.match(
			/from "([^"]*\/react\.js[^"]*)"/,
		)?.[1];
		if (!reactPath) throw new Error("Missing renderer React dependency");
		const [React, client] = await Promise.all([
			load(reactPath),
			load("/node_modules/.vite/deps/react-dom_client.js"),
		]);
		const host = document.createElement("div");
		document.body.replaceChildren(host);
		const e = React.default.createElement;
		let content: unknown;
		if (surface === "gallery") {
			const source = await fetch(
				"/src/containers/dashboard/templates/index.tsx",
			).then((response) => response.text());
			const routerPath = source.match(/from "([^"]*react-router[^"]*)"/)?.[1];
			if (!routerPath) throw new Error("Missing router dependency");
			const [routerModule, layout, gallery] = await Promise.all([
				load(routerPath),
				load("/src/containers/dashboard/dashboard-layout.tsx"),
				load("/src/containers/dashboard/templates/index.tsx"),
			]);
			const root = routerModule.createRootRoute({
				component: () => e(layout.DashboardLayout, null, e(gallery.default)),
			});
			const route = routerModule.createRoute({
				getParentRoute: () => root,
				path: "/dashboard/templates",
			});
			const router = routerModule.createRouter({
				routeTree: root.addChildren([route]),
				history: routerModule.createMemoryHistory({
					initialEntries: ["/dashboard/templates"],
				}),
			});
			content = e(routerModule.RouterProvider, { router });
		} else {
			const { SliderFieldDefinition } = await load(
				"/src/features/form-builder/elements/fields/slider.tsx",
			);
			const definition = new SliderFieldDefinition();
			function Fixture() {
				const [value, setValue] = React.default.useState(50);
				const [invalid, setInvalid] = React.default.useState(true);
				const [disabled, setDisabled] = React.default.useState(false);
				const [blurred, setBlurred] = React.default.useState(false);
				return e(
					"div",
					null,
					e(definition.component, {
						field: {
							...definition.defaultConfig(),
							id: "rating",
							label: "Overall experience",
							description: invalid ? "Choose a rating." : "",
							disabled,
						},
						value,
						onChange: setValue,
						onBlur: () => setBlurred(true),
						error: invalid ? "Choose a valid rating." : undefined,
					}),
					e("button", { onClick: () => setInvalid(false) }, "Clear error"),
					e(
						"button",
						{ onClick: () => setDisabled(!disabled) },
						"Toggle disabled",
					),
					e("output", null, blurred ? "Blur received" : "Not blurred"),
				);
			}
			content = e(Fixture);
		}
		client.default.createRoot(host).render(content);
	}, surface);
}

test("gallery preserves real fields, scale, aligned actions, and responsive layout", async ({
	page,
}, testInfo) => {
	await mount(page, "gallery");
	await expect(
		page.getByRole("heading", { name: "A head start for your next form." }),
	).toBeVisible();
	for (const width of [320, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 844 });
		const geometry = await page
			.locator('[data-slot="card-footer"]')
			.evaluateAll((footers) =>
				footers.map((footer) => {
					const [first, second] = Array.from(footer.children).map((child) =>
						child.getBoundingClientRect(),
					);
					return {
						firstHeight: first.height,
						secondHeight: second.height,
						sameTop: first.top === second.top,
						sameWidth: Math.abs(first.width - second.width) < 1,
						bottom: second.bottom,
					};
				}),
			);
		expect(geometry).toHaveLength(6);
		for (const row of geometry)
			expect(row).toMatchObject({
				firstHeight: 44,
				secondHeight: 44,
				sameTop: true,
				sameWidth: true,
			});
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		if (width === 390) expect(geometry[0].bottom).toBeLessThan(844);
		if (width === 390 || width === 1440)
			await testInfo.attach(`gallery-${width}`, {
				body: await page.screenshot({ fullPage: true }),
				contentType: "image/png",
			});
	}
	const trigger = page.getByRole("button", {
		name: "Preview Customer Feedback",
	});
	await trigger.click();
	const slider = page.getByRole("slider", {
		name: "Rate your overall experience",
	});
	await expect(slider).toHaveAttribute("aria-valuemin", "0");
	await expect(slider).toHaveAttribute("aria-valuemax", "10");
	await expect(slider).toHaveAttribute("aria-valuenow", "5");
	await expect(slider).toHaveAccessibleDescription(
		"Drag the slider from 0 to 10.",
	);
	await slider.focus();
	await slider.press("ArrowRight");
	await expect(slider).toHaveAttribute("aria-valuenow", "6");
	await slider.press("End");
	await expect(slider).toHaveAttribute("aria-valuenow", "10");
	await slider.press("Home");
	await expect(slider).toHaveAttribute("aria-valuenow", "0");
	await slider.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(trigger).toBeFocused();
});

test("shared slider names its thumb and updates help, errors, disabled state, and blur", async ({
	page,
}) => {
	await mount(page, "slider");
	const slider = page.getByRole("slider", { name: "Overall experience" });
	await expect(slider).toHaveAccessibleDescription(
		"Choose a rating. Choose a valid rating.",
	);
	await expect(slider).toHaveAttribute("aria-invalid", "true");
	await slider.focus();
	await slider.press("ArrowRight");
	await expect(slider).toHaveAttribute("aria-valuenow", "51");
	await expect(slider).toHaveAccessibleName("Overall experience");
	await slider.press("Tab");
	await expect(page.getByText("Blur received")).toBeVisible();
	await page.getByRole("button", { name: "Clear error" }).click();
	await expect(slider).not.toHaveAttribute("aria-describedby");
	await expect(slider).not.toHaveAttribute("aria-invalid");
	await page.getByRole("button", { name: "Toggle disabled" }).click();
	await expect(slider).toHaveAttribute("aria-disabled", "true");
	await expect(slider).not.toHaveAttribute("tabindex", "0");
	await page.getByRole("button", { name: "Toggle disabled" }).click();
	await expect(slider).not.toHaveAttribute("aria-disabled");
	await expect(slider).toHaveAttribute("tabindex", "0");
});
