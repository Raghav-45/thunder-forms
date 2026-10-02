import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import UmamiAnalytics from "#/components/UmamiAnalytics";
import { siteConfig } from "#/config/site";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools";
import appCss from "#/styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: siteConfig.name,
			},
			{
				name: "description",
				content: siteConfig.description,
			},
			{
				name: "keywords",
				content: siteConfig.keywords.join(", "),
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:locale",
				content: "en_US",
			},
			{
				property: "og:title",
				content: siteConfig.name,
			},
			{
				property: "og:description",
				content: siteConfig.description,
			},
			{
				property: "og:url",
				content: siteConfig.url,
			},
			{
				property: "og:site_name",
				content: siteConfig.name,
			},
			{
				property: "og:image",
				content: siteConfig.ogImage,
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: siteConfig.name,
			},
			{
				name: "twitter:description",
				content: siteConfig.description,
			},
			{
				name: "twitter:image",
				content: siteConfig.ogImage,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" style={{ colorScheme: "dark" }}>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				{children}
				<Toaster theme="dark" />
				<UmamiAnalytics />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
