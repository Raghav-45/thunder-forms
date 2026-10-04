import { Loader2Icon, PaletteIcon, SaveIcon } from "lucide-react";
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
		<div className="flex shrink-0 flex-row justify-between bg-[#111111] px-4 pt-6 md:px-4 md:pt-6">
			<h1 className="text-3xl font-bold">Builder</h1>
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-pressed={customizing}
					title={customizing ? "Back to builder" : "Customize your form"}
					onClick={onToggleCustomize}
				>
					<PaletteIcon data-icon="inline-start" />
					Customize
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
		</div>
	);
}
