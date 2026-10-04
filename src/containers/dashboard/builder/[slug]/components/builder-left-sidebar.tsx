import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "motion/react";
import type { ComponentProps } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { FormCustomization } from "#/containers/dashboard/builder/[slug]/components/form-customization";
import {
	type FormStructure,
	fieldCount,
} from "#/containers/dashboard/builder/[slug]/drag-model";
import { SettingsDialog } from "#/features/form-builder/components/settings-dialog";
import GenerateWithAiPrompt from "#/features/form-builder/core/generate-with-ai";
import ImportGoogleForm from "#/features/form-builder/core/import-google-form";
import type { FieldConfig } from "#/features/form-builder/elements";
import type { QuizSettings } from "#/features/form-builder/form-structure";
import { useFormStore } from "#/features/form-builder/store";
import type { QuizQuestionConfig } from "#/features/form-builder/types";
import type { ImportedGoogleFormPage } from "#/features/google-forms-import/types";

interface BuilderLeftSidebarProps {
	currentFormId: string;
	customizationProps: Omit<
		ComponentProps<typeof FormCustomization>,
		"side"
	> | null;
	customizationSessionId: number;
	formStructure: FormStructure;
	isExistingForm: boolean;
	mode: string;
	pageTransition: Transition;
	pageTransitionVariants: Variants;
	sidebarDirection: number;
	onQuizSettingsChange: (quiz: QuizSettings | undefined) => void;
	onQuizQuestionChange: (
		fieldId: string,
		quiz: QuizQuestionConfig | undefined,
	) => void;
	replaceWithImportedFields: (
		title: string,
		description: string,
		fields: FieldConfig[],
	) => void;
	replaceWithImportedPages: (
		title: string,
		description: string,
		importedPages: ImportedGoogleFormPage[],
	) => void;
}

export function BuilderLeftSidebar({
	currentFormId,
	customizationProps,
	customizationSessionId,
	formStructure,
	isExistingForm,
	mode,
	pageTransition,
	pageTransitionVariants,
	sidebarDirection,
	onQuizSettingsChange,
	onQuizQuestionChange,
	replaceWithImportedFields,
	replaceWithImportedPages,
}: BuilderLeftSidebarProps) {
	const { formSettings, setFormSettings } = useFormStore();
	return (
		<Card
			data-testid="builder-left-sidebar"
			className="hidden h-screen w-72 pb-0! shrink-0 overflow-hidden rounded-none border-0 border-r-2 md:block xl:w-80"
		>
			{/* Negated direction so the left sidebar mirrors the right one. */}
			<AnimatePresence mode="wait" custom={-sidebarDirection} initial={false}>
				<motion.div
					key={customizationProps ? `${mode}-${customizationSessionId}` : mode}
					custom={-sidebarDirection}
					variants={pageTransitionVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={pageTransition}
					className="h-full min-h-0"
				>
					{customizationProps ? (
						<CardContent className="flex h-full min-h-0 flex-col gap-4 pt-0 pr-0 pb-4 pl-4">
							<h2 className="shrink-0 pr-4 text-2xl font-bold">Appearance</h2>
							<FormCustomization {...customizationProps} side="appearance" />
						</CardContent>
					) : (
						<CardContent className="flex h-full flex-col space-y-4 px-4 pt-0 pb-4">
							<div className="mb-8">
								<h2 className="text-2xl font-bold">Settings</h2>
							</div>

							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="builder-title">Form title</Label>
								<Input
									id="builder-title"
									placeholder="Enter form name"
									value={formSettings.title}
									onChange={(event) =>
										setFormSettings({
											...formSettings,
											title: event.target.value,
										})
									}
									className="bg-neutral-900!"
								/>
							</div>

							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="builder-description">Description</Label>
								<Textarea
									id="builder-description"
									placeholder="Enter description"
									value={formSettings.description}
									onChange={(event) =>
										setFormSettings({
											...formSettings,
											description: event.target.value,
										})
									}
									className="max-h-24 bg-neutral-900!"
								/>
							</div>

							<SettingsDialog
								formId={isExistingForm ? currentFormId : null}
								formStructure={formStructure}
								onQuizSettingsChange={onQuizSettingsChange}
								onQuizQuestionChange={onQuizQuestionChange}
							/>
							<div className="flex-grow" />
							<ImportGoogleForm
								onImported={replaceWithImportedPages}
								hasExistingContent={fieldCount(formStructure) > 0}
							/>
							<GenerateWithAiPrompt
								onGeneratedFields={replaceWithImportedFields}
							/>
						</CardContent>
					)}
				</motion.div>
			</AnimatePresence>
		</Card>
	);
}
