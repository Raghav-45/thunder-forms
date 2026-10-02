import { type ComponentProps, useEffect, useRef } from "react";
import {
	getFormThemeFontUrls,
	getFormThemeStyle,
	normalizeFormTheme,
	type StoredFormTheme,
} from "#/features/form-builder/theme";
import { cn } from "#/lib/utils";

export function useFormThemeFonts(theme?: StoredFormTheme) {
	const fontUrls = getFormThemeFontUrls(theme).join("\n");
	useEffect(() => {
		if (!fontUrls) return;
		for (const href of fontUrls.split("\n")) {
			if (
				[
					...document.querySelectorAll<HTMLLinkElement>(
						'link[rel="stylesheet"]',
					),
				].some((link) => link.href === href)
			)
				continue;
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			link.dataset.formFonts = "";
			document.head.appendChild(link);
		}
	}, [fontUrls]);
}

export function FormThemeScope({
	theme,
	children,
	className,
	style,
	...props
}: ComponentProps<"div"> & { theme?: StoredFormTheme }) {
	const scopeRef = useRef<HTMLDivElement>(null);
	useFormThemeFonts(theme);

	useEffect(() => {
		if (!theme || !scopeRef.current) return;
		const { colors } = normalizeFormTheme(theme);
		const scope = scopeRef.current;
		const themedPortals = new Map<
			HTMLElement,
			{ style: string | null; theme: string | null }
		>();
		// Radix menus and calendars portal outside the form. Follow only the
		// aria-controls links from this form so the editor chrome keeps its theme.
		const updatePortals = () => {
			for (const trigger of scope.querySelectorAll("[aria-controls]")) {
				const id = trigger.getAttribute("aria-controls");
				const content = id ? document.getElementById(id) : null;
				if (!content || scope.contains(content) || themedPortals.has(content))
					continue;
				themedPortals.set(content, {
					style: content.getAttribute("style"),
					theme: content.getAttribute("data-form-theme"),
				});
				Object.assign(content.style, getFormThemeStyle(theme), {
					backgroundColor: colors.popover,
					color: colors["popover-foreground"],
				});
				for (const [key, value] of Object.entries(
					getFormThemeStyle(theme) ?? {},
				)) {
					if (key.startsWith("--"))
						content.style.setProperty(key, String(value));
				}
				content.setAttribute("data-form-theme", "true");
			}
		};
		updatePortals();
		const observer = new MutationObserver(updatePortals);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["aria-controls", "aria-expanded"],
		});
		return () => {
			observer.disconnect();
			for (const [content, previous] of themedPortals) {
				if (previous.style === null) content.removeAttribute("style");
				else content.setAttribute("style", previous.style);
				if (previous.theme === null) content.removeAttribute("data-form-theme");
				else content.setAttribute("data-form-theme", previous.theme);
			}
		};
	}, [theme]);

	if (!theme) return children;
	return (
		<div
			ref={scopeRef}
			data-form-theme
			className={cn("form-theme", className)}
			style={{ ...getFormThemeStyle(theme), ...style }}
			{...props}
		>
			{children}
		</div>
	);
}
