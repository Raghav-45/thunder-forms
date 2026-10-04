import { Link } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	Loader2Icon,
	PaletteIcon,
	SaveIcon,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { siteConfig } from "#/config/site";
import { CopyButton } from "#/features/form-builder/components/copy-button";

interface BuilderHeaderProps {
	currentFormId: string;
	customizing: boolean;
	isExistingForm: boolean;
	isSaving: boolean;
	saveDisabled: boolean;
	onSave: () => void;
	onToggleCustomize: () => void;
}

export function BuilderHeader({
	currentFormId,
	customizing,
	isExistingForm,
	isSaving,
	saveDisabled,
	onSave,
	onToggleCustomize,
}: BuilderHeaderProps) {
	return (
		<header className="grid min-h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 bg-[#111111] px-3 sm:px-4">
			<Button
				asChild
				variant="outline"
				size="sm"
				className="justify-self-start border-white/12 bg-transparent text-muted-foreground hover:bg-white/8 hover:text-foreground"
			>
				<Link to="/dashboard" title="Back to dashboard">
					<ArrowLeftIcon />
					<span className="hidden sm:inline">Back to dashboard</span>
					<span className="sr-only sm:hidden">Back to dashboard</span>
				</Link>
			</Button>
			<h1 className="text-sm font-semibold tracking-tight">Form builder</h1>
			<div className="flex shrink-0 items-center justify-self-end gap-1 sm:gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="bg-transparent hover:bg-white/8"
					aria-pressed={customizing}
					title={customizing ? "Back to builder" : "Customize your form"}
					onClick={onToggleCustomize}
				>
					<PaletteIcon data-icon="inline-start" />
					<span className="hidden sm:inline">Customize</span>
					<span className="sr-only sm:hidden">Customize your form</span>
				</Button>
				{isExistingForm ? (
					<CopyButton
						className="h-8"
						value={`${siteConfig.url}/forms/${currentFormId}`}
					/>
				) : null}
				<Button
					type="button"
					variant="secondary"
					className="h-8 cursor-pointer"
					onClick={onSave}
					disabled={isSaving || saveDisabled}
				>
					{isSaving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
					{isSaving ? "Saving..." : "Save"}
				</Button>
			</div>
		</header>
	);
}
