import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { FormClosedDialog } from "#/containers/public/forms/components/form-closed-dialog";
import { FormSubmittedPage } from "#/containers/public/forms/components/form-submitted-page";
import { FormThemeScope } from "#/features/form-builder/components/form-theme-scope";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	DEFAULT_FORM_LAYOUT,
	type FormStructure,
	type FormPage as FormStructurePage,
	getOrderedFormFields,
	isFormStructure,
	type NormalizedFormLayout,
	normalizeFormLayout,
} from "#/features/form-builder/form-structure";
import {
	type FormTheme,
	normalizeFormTheme,
} from "#/features/form-builder/theme";
import { validateFormFields } from "#/features/form-builder/utils/formValidation";
import { getFieldComponent } from "#/features/form-builder/utils/helperFunctions";
import type { QuizResult } from "#/features/form-builder/utils/quiz";

interface FormPageProps {
	slug: string;
}

interface PublicFormSettings {
	title: string;
	description?: string;
	expiresAt?: Date;
	maxSubmissions?: number;
	redirectUrl?: string;
	submitButtonText?: string;
}

export default function PublicFormPage({ slug: currentFormId }: FormPageProps) {
	const [fields, setFields] = useState<FieldConfig[]>([]);
	const [pages, setPages] = useState<FormStructurePage[]>([]);
	const [theme, setTheme] = useState<FormTheme>();
	const [layout, setLayout] =
		useState<NormalizedFormLayout>(DEFAULT_FORM_LAYOUT);
	const [activePageIndex, setActivePageIndex] = useState(0);
	const [formSettings, setFormSettings] = useState<PublicFormSettings | null>(
		null,
	);
	const [isFormSubmitted, setIsFormSubmitted] = useState(false);
	const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
	const [quizPendingReview, setQuizPendingReview] = useState(false);
	const [formData, setFormData] = useState<Record<string, unknown>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadingFieldCount, setUploadingFieldCount] = useState(0);
	const [formStatus, setFormStatus] = useState<string>("Active");
	const [showClosedDialog, setShowClosedDialog] = useState(false);
	const uploadingFieldIds = useRef(new Set<string>());

	// Check if form is closed based on status
	const checkIsFormClosed = (status: string) => {
		return status.startsWith("Closed");
	};

	const handleFieldChange = (fieldId: string, value: unknown) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value,
		}));

		// Clear any existing errors for this field when user starts typing
		if (errors[fieldId]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[fieldId];
				return newErrors;
			});
		}
	};

	const handleUploadStateChange = useCallback(
		(fieldId: string, isUploading: boolean) => {
			const nextUploadingFieldIds = new Set(uploadingFieldIds.current);
			if (isUploading) {
				nextUploadingFieldIds.add(fieldId);
			} else {
				nextUploadingFieldIds.delete(fieldId);
			}
			uploadingFieldIds.current = nextUploadingFieldIds;
			setUploadingFieldCount(nextUploadingFieldIds.size);
		},
		[],
	);

	const handleSubmit = async () => {
		if (uploadingFieldIds.current.size > 0) {
			toast.error("Wait for file uploads to finish before submitting");
			return;
		}

		const newErrors = validateFormFields(fields, formData);
		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			const errorCount = Object.keys(newErrors).length;
			const firstError = Object.values(newErrors)[0];
			if (errorCount === 1) {
				toast.error(firstError);
			} else {
				toast.error(
					`Please fix ${errorCount} field${errorCount > 1 ? "s" : ""} before submitting`,
				);
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await axios.post(`/api/forms/${currentFormId}/submit`, {
				data: formData,
			});
			setQuizResult(response.data.quizResult ?? null);
			setQuizPendingReview(response.data.quizPendingReview === true);
			setIsFormSubmitted(true);
			toast.success("Form submitted successfully!");
		} catch (error) {
			console.error("Form submission error:", error);
			if (axios.isAxiosError(error)) {
				if (
					error.response?.status === 422 &&
					error.response?.data?.validationErrors
				) {
					// Handle server-side validation errors
					const serverErrors = error.response.data.validationErrors;
					setErrors(serverErrors);
					const errorCount = Object.keys(serverErrors).length;
					toast.error(
						`Server validation failed: Please fix ${errorCount} field${errorCount > 1 ? "s" : ""} and try again`,
					);
				} else if (error.response?.data?.error) {
					toast.error(error.response.data.error);
				} else {
					toast.error("Failed to submit form. Please try again.");
				}
			} else {
				toast.error("Failed to submit form. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNextPage = () => {
		const activePage = pages[activePageIndex];
		if (!activePage) return;

		const pageFields = activePage.sections.flatMap((section) => section.fields);
		const pageErrors = validateFormFields(pageFields, formData);
		setErrors(pageErrors);

		if (Object.keys(pageErrors).length > 0) {
			toast.error("Please fix the highlighted fields before continuing");
			return;
		}

		setActivePageIndex((index) => index + 1);
	};

	const renderField = (field: FieldConfig) => {
		const FieldComponent = getFieldComponent(field.uniqueIdentifier);

		// Create a disabled version of the field config when form is closed
		const fieldConfig = checkIsFormClosed(formStatus)
			? ({ ...field, disabled: true } as FieldConfig)
			: field;

		return (
			<div key={field.id} className="relative group">
				<div className="w-full">
					<FieldComponent
						field={fieldConfig as never}
						value={formData[field.id]}
						onChange={(value) => handleFieldChange(field.id, value)}
						onUploadStateChange={handleUploadStateChange}
						error={errors[field.id]}
						formId={currentFormId}
					/>
				</div>
			</div>
		);
	};

	const form = useQuery({
		queryKey: ["public-form", currentFormId],
		queryFn: async () => {
			const { data } = await axios.get(`/api/forms/${currentFormId}/viewForm`);
			return data;
		},
		enabled: !!currentFormId,
		retry: false,
		retryOnMount: false,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	// Use useEffect to set state when form data is successfully loaded
	useEffect(() => {
		if (form.isError) {
			toast.error("Failed to load Form");
			return;
		}

		if (form.isSuccess && form.data) {
			const expiresAt = form.data.expiresAt
				? new Date(form.data.expiresAt)
				: undefined;

			setFormSettings({
				title: form.data.title,
				description: form.data.description,
				expiresAt,
				maxSubmissions: form.data.maxSubmissions,
				redirectUrl: form.data.redirectUrl,
				submitButtonText: form.data.submitButtonText,
			});
			if (!isFormStructure(form.data.fields)) {
				toast.error("Form is unavailable");
				return;
			}

			const formStructure = form.data.fields as FormStructure;
			const normalizedFields = getOrderedFormFields(formStructure);
			setFields(normalizedFields);
			setPages(formStructure.pages);
			setLayout(normalizeFormLayout(formStructure.layout));
			setTheme(
				formStructure.theme
					? normalizeFormTheme(formStructure.theme)
					: undefined,
			);
			setActivePageIndex(0);

			// Check if form is closed based on status from API
			const isClosed = checkIsFormClosed(form.data.status);
			setFormStatus(form.data.status);

			if (isClosed) {
				setShowClosedDialog(true);
			}

			// Initialize form data with default values
			const initialFormData: Record<string, unknown> = {};
			normalizedFields.forEach((field) => {
				if (
					field.uniqueIdentifier === "switch-field" ||
					field.uniqueIdentifier === "checkbox"
				) {
					// Start as undefined (unanswered) so required validation can detect no interaction
					initialFormData[field.id] = undefined;
				} else if (
					field.uniqueIdentifier === "multi-select" ||
					field.uniqueIdentifier === "file-upload"
				) {
					initialFormData[field.id] = [];
				} else if (field.uniqueIdentifier === "slider") {
					// Slider starts at its default value (or min)
					const sliderField = field as { defaultValue?: number; min?: number };
					initialFormData[field.id] =
						sliderField.defaultValue ?? sliderField.min ?? 0;
				} else {
					initialFormData[field.id] = "";
				}
			});
			setFormData(initialFormData);
		}
	}, [form.isError, form.isSuccess, form.data, setFormSettings]);

	// Handle loading state
	if (form.isLoading) {
		return <SkeletonPage />;
	}

	// Handle empty fields state
	if (form.isError) {
		return <FormUnavailablePage />;
	}

	if (!formSettings || !fields) {
		return <SkeletonPage />;
	}

	if (fields.length === 0) {
		return (
			<FormUnavailablePage
				title="This form is not ready"
				description="The form owner has not added any questions yet."
			/>
		);
	}

	if (isFormSubmitted) {
		return (
			<FormThemeScope theme={theme} className="min-h-screen">
				<FormSubmittedPage
					redirectUrl={formSettings.redirectUrl}
					quizPendingReview={quizPendingReview}
					quizResult={quizResult}
					formPath={`/forms/${currentFormId}`}
				/>
			</FormThemeScope>
		);
	}

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
	}[layout.contentWidth ?? "standard"];
	const contentAlignment =
		layout.contentAlignment === "left" ? "mr-auto" : "mx-auto";
	const sectionSpacing = {
		compact: "p-3 sm:p-4",
		comfortable: "p-4 sm:p-6",
		spacious: "p-6 sm:p-8",
	}[layout.sectionSpacing ?? "comfortable"];
	const layoutGap = (units: number) => `calc(var(--spacing) * ${units})`;
	const headerAlignment =
		layout.headerAlignment === "center"
			? "items-center text-center"
			: "items-start text-left";
	const submitAlignment = {
		left: "justify-start",
		center: "justify-center",
		right: "justify-end",
	}[layout.submitAlignment ?? "left"];

	return (
		<FormThemeScope theme={theme} className="min-h-screen">
			<FormClosedDialog
				isOpen={showClosedDialog}
				onClose={() => setShowClosedDialog(false)}
				expiresAt={formSettings.expiresAt}
				formTitle={formSettings.title}
				reason={
					formStatus === "Closed | Completed"
						? "max-submissions"
						: formStatus === "Closed | Expired"
							? "expired"
							: "both"
				}
			/>
			<main
				className={`${contentAlignment} flex w-full flex-col ${contentWidth} p-4 pt-16 pb-16 md:p-10`}
			>
				<div
					className={`flex flex-col ${headerAlignment}`}
					style={{ gap: layoutGap(layout.spacing.titleDescriptionGap) }}
				>
					<h1 className="text-2xl md:text-5xl font-bold tracking-tight">
						{formSettings.title}
					</h1>
					<p className="text-base text-muted-foreground md:text-lg">
						{formSettings.description}
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
									{section.fields.map((field) => renderField(field))}
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
							onClick={() => setActivePageIndex((index) => index - 1)}
							disabled={isSubmitting}
						>
							Previous
						</Button>
					) : null}
					{isLastPage ? (
						<Button
							className="w-full md:w-auto"
							onClick={handleSubmit}
							disabled={
								isSubmitting ||
								uploadingFieldCount > 0 ||
								checkIsFormClosed(formStatus)
							}
						>
							{isSubmitting
								? "Submitting..."
								: formSettings.submitButtonText || "Submit"}
						</Button>
					) : (
						<Button
							type="button"
							onClick={handleNextPage}
							disabled={
								uploadingFieldCount > 0 || checkIsFormClosed(formStatus)
							}
						>
							Next
						</Button>
					)}
				</div>
			</main>
		</FormThemeScope>
	);
}

function FormUnavailablePage({
	title = "This form is unavailable",
	description = "It may have been removed or is temporarily unavailable.",
}: {
	title?: string;
	description?: string;
}) {
	return (
		<main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-16 md:px-10">
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
				<p className="text-muted-foreground">{description}</p>
			</div>
		</main>
	);
}

// Skeleton component for loading state
function SkeletonPage() {
	return (
		<div className="mx-auto max-w-6xl space-y-8 p-4 pt-16 md:p-10 pb-16">
			<div className="animate-pulse delay-0 space-y-1 md:space-y-1.5">
				<div className="animate-pulse delay-0 h-8 md:h-12 bg-neutral-700 rounded w-1/3 md:w-1/5"></div>
				<div className="animate-pulse delay-700 h-4 bg-neutral-700 rounded w-1/2 md:w-1/3"></div>
			</div>
			<div className="space-y-4 md:space-y-9">
				<div className="animate-pulse delay-0 grid w-full items-center gap-2 md:gap-3">
					<div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
					<div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
				</div>
				<div className="animate-pulse delay-500 grid w-full items-center gap-2 md:gap-3">
					<div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
					<div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
				</div>
				<div className="animate-pulse delay-1000 grid w-full items-center pt-4 md:pt-0 gap-2 md:gap-3">
					<div className="animate-pulse delay-1000 h-10 bg-neutral-700 rounded w-32"></div>
				</div>
			</div>
		</div>
	);
}
