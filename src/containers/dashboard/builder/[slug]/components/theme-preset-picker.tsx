import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import communityThemes from "#/containers/dashboard/builder/[slug]/constants/community-themes.json";
import {
	createFormTheme,
	FORM_FONTS,
	FORM_THEME_PRESETS,
	type FormTheme,
	getFormThemeShadows,
	importFormThemeVariables,
} from "#/features/form-builder/theme";

export function ThemePresetPicker({
	onSelect,
}: {
	onSelect: (theme: FormTheme) => void;
}) {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<{
		name: string;
		author?: string;
		url?: string;
	}>();
	return (
		<div className="flex flex-col gap-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id="form-theme-preset"
						role="combobox"
						aria-label="Form style"
						aria-expanded={open}
						variant="outline"
						className="w-full justify-between"
					>
						<span className="truncate">
							{selected?.name ?? "Choose a form style"}
						</span>
						<ChevronsUpDownIcon data-icon="inline-end" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[var(--radix-popover-trigger-width)] p-0"
					align="start"
					style={{ height: "min(22rem, calc(100dvh - 2rem))" }}
				>
					<Command className="h-full min-h-0">
						<CommandInput
							placeholder="Search themes or creators..."
							aria-label="Search themes or creators"
						/>
						<CommandList
							className="min-h-0 flex-1 max-h-none overflow-y-scroll overscroll-contain"
							onWheel={(event) => {
								const list = event.currentTarget;
								const next = Math.min(
									Math.max(0, list.scrollTop + event.deltaY),
									list.scrollHeight - list.clientHeight,
								);
								if (next === list.scrollTop) return;
								list.scrollTop = next;
								event.preventDefault();
								event.stopPropagation();
							}}
						>
							<CommandEmpty>No matching themes.</CommandEmpty>
							<CommandGroup heading="ThunderForms">
								{FORM_THEME_PRESETS.map((preset) => {
									const theme = createFormTheme(preset.id);
									return (
										<CommandItem
											className="group/preset"
											key={preset.id}
											value={preset.id}
											keywords={[
												preset.label,
												preset.description,
												"ThunderForms",
											]}
											aria-label={preset.label}
											onSelect={() => {
												onSelect(theme);
												setSelected({ name: preset.label });
												setOpen(false);
											}}
										>
											<span
												aria-hidden="true"
												className="h-11 w-14 shrink-0 overflow-hidden rounded-sm border p-1.5"
												style={{
													backgroundColor: theme.colors.background,
													borderColor: theme.colors.border,
												}}
											>
												<span
													className="flex h-full flex-col justify-center gap-1 border p-1"
													style={{
														backgroundColor: theme.colors.card,
														color: theme.colors.foreground,
														borderColor: theme.colors.border,
														borderRadius: Math.min(theme.radius * 5, 8),
														boxShadow: getFormThemeShadows(theme).shadow,
														fontFamily: FORM_FONTS[theme.fontFamily].value,
													}}
												>
													<span className="text-[10px] leading-none">Aa</span>
													<span
														className="h-1.5 w-5"
														style={{
															backgroundColor: theme.colors.primary,
															borderRadius: Math.min(theme.radius * 3, 4),
														}}
													/>
												</span>
											</span>
											<span className="flex min-w-0 flex-1 flex-col gap-0.5">
												<span>{preset.label}</span>
												<span className="text-xs text-muted-foreground group-data-[selected=true]/preset:text-accent-foreground">
													{preset.description}
												</span>
											</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
							<CommandGroup heading="tweakcn community">
								{communityThemes.map((preset) => (
									<CommandItem
										className="group/preset"
										key={preset.id}
										value={preset.id}
										keywords={[preset.name, preset.author]}
										aria-label={preset.name}
										onSelect={() => {
											try {
												onSelect(
													importFormThemeVariables(
														preset.variables,
														createFormTheme(),
													),
												);
												setSelected(preset);
												setOpen(false);
											} catch (error) {
												toast.error(
													error instanceof Error
														? error.message
														: "Could not load theme",
												);
											}
										}}
									>
										<span
											className="size-4 shrink-0 rounded-full border"
											style={{ backgroundColor: preset.variables.primary }}
										/>
										<span className="flex min-w-0 flex-col">
											<span className="truncate">{preset.name}</span>
											<span className="truncate text-xs text-muted-foreground group-data-[selected=true]/preset:text-accent-foreground">
												by {preset.author}
											</span>
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selected?.author && selected.url ? (
				<a
					href={selected.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-muted-foreground underline underline-offset-4"
				>
					View {selected.name} by {selected.author} on tweakcn
				</a>
			) : null}
		</div>
	);
}
