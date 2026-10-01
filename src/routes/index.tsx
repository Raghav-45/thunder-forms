import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";
import Landing1Page from "#/containers/landing-page";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<Landing1Page />
			</main>
			<SiteFooter />
		</>
	);
}
