import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

function isTanStackStartPlugin(plugin: PluginOption): boolean {
	return (
		typeof plugin === "object" &&
		plugin !== null &&
		"name" in plugin &&
		typeof plugin.name === "string" &&
		plugin.name.startsWith("tanstack")
	);
}

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-mcp",
	],
	framework: "@storybook/react-vite",
	async viteFinal(config) {
		return {
			...config,
			plugins: config.plugins
				?.flat(Infinity)
				.filter((plugin) => !isTanStackStartPlugin(plugin as PluginOption)),
		};
	},
};
export default config;
