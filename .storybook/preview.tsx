import "#/styles.css";
import { useEffect, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";

function DarkPreview({ children }: { children: ReactNode }) {
	useEffect(() => {
		document.body.classList.add("dark");

		return () => document.body.classList.remove("dark");
	}, []);

	return children;
}

const preview: Preview = {
	tags: ["autodocs"],
	decorators: [(Story) => <DarkPreview><Story /></DarkPreview>],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		a11y: {
			// "todo" - show a11y violations in the test UI only
			// "error" - fail CI on a11y violations
			// "off" - skip a11y checks entirely
			test: "todo",
		},
	},
};

export default preview;
