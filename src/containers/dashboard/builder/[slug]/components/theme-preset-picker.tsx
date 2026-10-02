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
	FORM_THEME_PRESETS,
	type FormTheme,
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
				>
					<Command>
						<CommandInput
							placeholder="Search themes or creators..."
							aria-label="Search themes or creators"
						/>
						<CommandList>
							<CommandEmpty>No matching themes.</CommandEmpty>
							<CommandGroup heading="tweakcn community">
								{communityThemes.map((preset) => (
									<CommandItem
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
											<span className="truncate text-xs text-muted-foreground">
												by {preset.author}
											</span>
										</span>
									</CommandItem>
								))}
							</CommandGroup>
							<CommandGroup heading="ThunderForms">
								{FORM_THEME_PRESETS.map((preset) => (
									<CommandItem
										key={preset.id}
										value={preset.id}
										keywords={[preset.label]}
										aria-label={preset.label}
										onSelect={() => {
											onSelect(createFormTheme(preset.id));
											setSelected({ name: preset.label });
											setOpen(false);
										}}
									>
										<span
											className="size-4 shrink-0 rounded-full border"
											style={{ backgroundColor: preset.primary }}
										/>
										{preset.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<a
				href={selected?.url ?? "https://tweakcn.com/community"}
				target="_blank"
				rel="noopener noreferrer"
				className="text-xs text-muted-foreground underline underline-offset-4"
			>
				{selected?.author
					? `View ${selected.name} by ${selected.author} on tweakcn`
					: `${communityThemes.length} community presets · Browse all on tweakcn`}
			</a>
		</div>
	);
}
