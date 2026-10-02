import { useId, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { instantiateTemplate } from "#/containers/dashboard/templates/instantiate-template";
import type { FormTemplateSpec } from "#/containers/dashboard/templates/types";
import { getFieldComponent } from "#/features/form-builder/utils/helperFunctions";
import { cn } from "#/lib/utils";

/** Uses the builder's field configs and renderers; preview answers stay local. */
export function TemplateFormPreview({
	template,
	thumbnail = false,
}: {
	template: FormTemplateSpec;
	thumbnail?: boolean;
}) {
	const previewId = useId();
	const [values, setValues] = useState<Record<string, unknown>>({});
	const sections = useMemo(
		() =>
			instantiateTemplate(template).pages.flatMap((page) =>
				page.sections.map((section, sectionIndex) => ({
					...section,
					id: `${previewId}-section-${sectionIndex}`,
					fields: section.fields.map((field, fieldIndex) => ({
						...field,
						// Stable across hydration and distinct from every other preview.
						id: `${previewId}-field-${sectionIndex}-${fieldIndex}`,
						...("options" in field && {
							options: field.options.map((option, optionIndex) => ({
								...option,
								id: `${previewId}-option-${sectionIndex}-${fieldIndex}-${optionIndex}`,
							})),
						}),
					})),
				})),
			),
		[template, previewId],
	);

	return (
		<div
			inert={thumbnail || undefined}
			className={cn(
				"flex min-w-0 flex-col gap-6 text-card-foreground",
				thumbnail && "w-[125%] origin-top-left scale-[0.8] gap-4",
			)}
		>
			{sections.map((section, sectionIndex) => (
				<div key={section.id} className="flex min-w-0 flex-col gap-5">
					{sections.length > 1 && (
						<h3 className="font-semibold">Section {sectionIndex + 1}</h3>
					)}
					{section.fields.map((field) => {
						const FieldComponent = getFieldComponent(field.uniqueIdentifier);
						return (
							<FieldComponent
								key={field.id}
								field={field as never}
								value={values[field.id]}
								onChange={(value) =>
									setValues((previous) => ({ ...previous, [field.id]: value }))
								}
							/>
						);
					})}
				</div>
			))}
			<Button type="button" size="lg" className="h-11 w-full" disabled>
				{template.submitButtonText || "Submit"}
			</Button>
		</div>
	);
}
