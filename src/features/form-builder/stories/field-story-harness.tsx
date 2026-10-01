import { GripVerticalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import type { FormFieldDefinition } from "#/features/form-builder/elements/base";
import type { BaseFieldConfig } from "#/features/form-builder/types";

interface FieldStoryHarnessProps<TConfig extends BaseFieldConfig> {
	definition: FormFieldDefinition<TConfig>;
	field: TConfig;
	initialValue?: unknown;
	error?: string;
	formId?: string;
	isPersisted?: boolean;
}

function valueLabel(value: unknown): string {
	if (value === undefined || value === null || value === "") {
		return "No response yet";
	}

	return typeof value === "string" ? value : JSON.stringify(value);
}

function ResponseInspector({
	isUploading,
	value,
}: {
	isUploading: boolean;
	value: unknown;
}) {
	return (
		<div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#2a2a2a] bg-[#111] px-5 py-4 text-sm text-[#a3a3a3]">
			<p className="font-medium text-[#d4d4d4]">Response state</p>
			<p aria-live="polite" className="mt-1 break-words text-[#8a8a8a]">
				{isUploading ? "Uploading…" : valueLabel(value)}
			</p>
		</div>
	);
}

function FormSectionCanvas({
	action,
	children,
}: {
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<main className="flex flex-1 items-center justify-center p-3 text-[#ededed] sm:p-6">
			<section className="mx-auto w-full max-w-4xl rounded-[2.5rem] border border-[#282828] bg-[#151515] p-5 sm:p-7">
				<header className="flex items-center justify-between gap-4 text-[#ababab]">
					<div className="flex items-center gap-3">
						<GripVerticalIcon aria-hidden="true" className="size-5" />
						<h1 className="text-xl font-medium sm:text-2xl">Section 1</h1>
					</div>
					{action}
				</header>
				<div className="mt-7 space-y-5">{children}</div>
			</section>
		</main>
	);
}

function FieldStoryLayout({
	action,
	children,
	isUploading,
	value,
}: {
	action?: React.ReactNode;
	children: React.ReactNode;
	isUploading: boolean;
	value: unknown;
}) {
	return (
		<div className="dark flex min-h-screen flex-col bg-[#0d0d0d] pb-6">
			<FormSectionCanvas action={action}>{children}</FormSectionCanvas>
			<ResponseInspector isUploading={isUploading} value={value} />
		</div>
	);
}

function FieldBoundary({ children }: { children: React.ReactNode }) {
	return (
		<div className="w-full rounded-[1.75rem] border-2 border-dashed border-[#292929] bg-[#141414] p-5 sm:p-6">
			{children}
		</div>
	);
}

export function FieldRendererHarness<TConfig extends BaseFieldConfig>({
	definition,
	field,
	initialValue,
	error,
	formId,
}: FieldStoryHarnessProps<TConfig>) {
	const [value, setValue] = useState<unknown>(initialValue);
	const [isUploading, setIsUploading] = useState(false);
	const Renderer = definition.component;

	return (
		<FieldStoryLayout isUploading={isUploading} value={value}>
			<FieldBoundary>
				<Renderer
					field={field}
					value={value}
					onChange={setValue}
					onUploadStateChange={(_, uploading) => setIsUploading(uploading)}
					error={error}
					formId={formId}
				/>
			</FieldBoundary>
		</FieldStoryLayout>
	);
}

export function FieldEditorHarness<TConfig extends BaseFieldConfig>({
	definition,
	field,
	initialValue,
	formId,
	isPersisted = false,
}: Omit<FieldStoryHarnessProps<TConfig>, "error">) {
	const [currentField, setCurrentField] = useState(field);
	const [value, setValue] = useState<unknown>(initialValue);
	const [isUploading, setIsUploading] = useState(false);
	const [isEditorOpen, setIsEditorOpen] = useState(true);
	const Renderer = definition.component;
	const Editor = definition.editor;

	return (
		<>
			<FieldStoryLayout
				action={
					<Button onClick={() => setIsEditorOpen(true)} type="button">
						Configure field
					</Button>
				}
				isUploading={isUploading}
				value={value}
			>
				<FieldBoundary>
					<Renderer
						field={currentField}
						value={value}
						onChange={setValue}
						onUploadStateChange={(_, uploading) => setIsUploading(uploading)}
						formId={formId}
					/>
				</FieldBoundary>
			</FieldStoryLayout>
			<Editor
				field={currentField}
				isOpen={isEditorOpen}
				onUpdate={setCurrentField}
				onClose={() => setIsEditorOpen(false)}
				formId={formId}
				isPersisted={isPersisted}
			/>
		</>
	);
}
