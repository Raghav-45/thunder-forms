import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { FORM_SUBMIT_WIDTH_CLASSES } from "#/features/form-builder/constants";
import type { FieldConfig } from "#/features/form-builder/elements";
import type {
	FormPage,
	NormalizedFormLayout,
} from "#/features/form-builder/form-structure";
import { cn } from "#/lib/utils";

interface RespondentFormContentProps {
	activePageIndex: number;
	description?: string;
	fields: (field: FieldConfig) => ReactNode;
	isFormClosed?: boolean;
	isSubmitting?: boolean;
	isSubmitDisabled?: boolean;
	layout: NormalizedFormLayout;
	onNextPage: () => void;
	onPreviousPage: () => void;
	onSubmit: () => void;
	pages: FormPage[];
	submitButtonText?: string;
	title: string;
}

export function RespondentFormContent({
	activePageIndex,
	description,
	fields,
	isFormClosed = false,
	isSubmitting = false,
	isSubmitDisabled = false,
	layout,
	onNextPage,
	onPreviousPage,
	onSubmit,
	pages,
	submitButtonText,
	title,
}: RespondentFormContentProps) {
	const activePage = pages[activePageIndex];
	const isLastPage = activePageIndex === pages.length - 1;
	const pageTitle = activePage?.title?.trim();
	const hasPageTitle =
		Boolean(pageTitle) &&
		pageTitle?.toLowerCase() !== `page ${activePageIndex + 1}`;
	const pageDescription = activePage?.description?.trim();
	const contentWidth = {
		compact: "max-w-3xl",
		standard: "max-w-6xl",
		wide: "max-w-7xl",
	}[layout.contentWidth];
	const contentAlignment =
		layout.contentAlignment === "left" ? "mr-auto" : "mx-auto";
	const sectionSpacing = {
		compact: "p-3 sm:p-4",
		comfortable: "p-4 sm:p-6",
		spacious: "p-6 sm:p-8",
	}[layout.sectionSpacing];
	const layoutGap = (units: number) => `calc(var(--spacing) * ${units})`;
	const headerAlignment =
		layout.headerAlignment === "center"
			? "items-center text-center"
			: "items-start text-left";
	const submitAlignment = {
		left: "justify-start",
		center: "justify-center",
		right: "justify-end",
	}[layout.submitAlignment];

	return (
		<main
			data-testid="respondent-form"
			className={`${contentAlignment} flex min-h-screen w-full flex-col ${contentWidth} p-4 pt-16 pb-16 md:p-10`}
		>
			<div
				className={`flex flex-col ${headerAlignment}`}
				style={{ gap: layoutGap(layout.spacing.titleDescriptionGap) }}
			>
				<h1 className="text-2xl md:text-5xl font-bold tracking-tight">
					{title}
				</h1>
				<p className="text-base text-muted-foreground md:text-lg">
					{description}
				</p>
			</div>
			<div
				className="flex w-full flex-col gap-6"
				style={{ marginTop: layoutGap(layout.spacing.titleContentGap) }}
			>
				{pages.length > 1 ? (
					<div className="flex flex-wrap items-center justify-between gap-3 pt-4">
						<p
							className="text-sm font-semibold tabular-nums"
							aria-live="polite"
							aria-atomic="true"
						>
							Page {activePageIndex + 1} of {pages.length}
						</p>
						<div
							className="flex flex-wrap items-center gap-1.5"
							aria-hidden="true"
						>
							{pages.map((page, index) => (
								<span
									key={page.id}
									className={`h-1.5 shrink-0 rounded-full transition-[width,background-color] duration-250 ease-out motion-reduce:transition-none ${index === activePageIndex ? "w-5 bg-primary" : index < activePageIndex ? "w-1.5 bg-primary/40" : "w-1.5 bg-border"}`}
								/>
							))}
						</div>
					</div>
				) : null}
				{hasPageTitle || pageDescription ? (
					<header className="space-y-2">
						{hasPageTitle ? (
							<h2 className="text-xl font-semibold tracking-tight">
								{pageTitle}
							</h2>
						) : null}
						{pageDescription ? (
							<p className="text-muted-foreground">{pageDescription}</p>
						) : null}
					</header>
				) : null}
				<div
					className="flex flex-col"
					style={{ gap: layoutGap(layout.spacing.sectionGap) }}
				>
					{activePage?.sections.map((section, sectionIndex) => (
						<section
							key={section.id}
							aria-labelledby={`form-section-${section.id}`}
							className={`flex min-w-0 flex-col rounded-xl border bg-card ${sectionSpacing}`}
						>
							<div
								className="space-y-1 border-b pb-4"
								style={{
									marginBottom: layoutGap(layout.spacing.sectionTitleGap),
								}}
							>
								<h3
									id={`form-section-${section.id}`}
									className="text-base font-semibold"
								>
									{section.title || `Section ${sectionIndex + 1}`}
								</h3>
								{section.description ? (
									<p className="text-sm leading-relaxed text-muted-foreground">
										{section.description}
									</p>
								) : null}
							</div>
							<div
								className="flex flex-col"
								style={{ gap: layoutGap(layout.spacing.fieldGap) }}
							>
								{section.fields.map((field) => fields(field))}
							</div>
						</section>
					))}
				</div>
			</div>
			<div
				className={`flex flex-wrap gap-3 ${submitAlignment}`}
				style={{ marginTop: layoutGap(layout.spacing.submitGap) }}
			>
				{activePageIndex > 0 ? (
					<Button
						type="button"
						variant="outline"
						onClick={onPreviousPage}
						disabled={isSubmitting}
					>
						Previous
					</Button>
				) : null}
				{isLastPage ? (
					<Button
						className={cn(
							"h-auto min-h-9 max-w-full whitespace-normal break-words",
							FORM_SUBMIT_WIDTH_CLASSES[layout.submitWidth],
						)}
						onClick={onSubmit}
						disabled={isSubmitting || isSubmitDisabled || isFormClosed}
					>
						{isSubmitting ? "Submitting..." : submitButtonText || "Submit"}
					</Button>
				) : (
					<Button
						type="button"
						onClick={onNextPage}
						disabled={isSubmitDisabled || isFormClosed}
					>
						Next
					</Button>
				)}
			</div>
		</main>
	);
}
