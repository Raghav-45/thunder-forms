import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, EyeIcon, SearchIcon } from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { TemplateFormPreview } from "#/containers/dashboard/templates/components/template-form-preview";
import {
	countTemplateFields,
	FORM_TEMPLATES,
} from "#/containers/dashboard/templates/constants";
import type { FormTemplateSpec } from "#/containers/dashboard/templates/types";
import { cn } from "#/lib/utils";

function TemplateCard({ template }: { template: FormTemplateSpec }) {
	const fieldCount = countTemplateFields(template);
	const requiredCount = template.sections
		.flatMap((section) => section.fields)
		.filter((field) => field.required).length;

	return (
		<Dialog>
			<Card className="h-full gap-0 overflow-hidden rounded-xl py-0 shadow-none">
				<div
					aria-hidden="true"
					className="relative h-40 overflow-hidden bg-muted/60 p-4 pb-0 sm:h-64 sm:p-6 sm:pb-0"
				>
					<div className="h-full overflow-hidden rounded-t-xl border border-b-0 bg-card p-4 sm:p-5">
						<TemplateFormPreview template={template} thumbnail />
					</div>
				</div>
				<CardHeader className="flex flex-1 flex-col gap-3 p-5">
					<div className="flex items-center justify-between gap-3">
						<Badge variant="secondary">{template.category}</Badge>
						<span className="text-xs tabular-nums text-muted-foreground">
							{fieldCount} fields
						</span>
					</div>
					<CardTitle>
						<h2 className="text-lg leading-6 tracking-tight">
							{template.title}
						</h2>
					</CardTitle>
					<CardDescription className="leading-6">
						{template.description}
					</CardDescription>
				</CardHeader>
				<CardFooter className="grid grid-cols-2 items-stretch gap-2 px-5 pb-5">
					<DialogTrigger asChild>
						<Button
							variant="outline"
							size="lg"
							className="h-11 min-w-0 px-3"
							aria-label={`Preview ${template.title}`}
						>
							<EyeIcon data-icon="inline-start" />
							Preview
						</Button>
					</DialogTrigger>
					<Button size="lg" className="h-11 min-w-0 px-3" asChild>
						<Link
							to="/dashboard/builder/$slug"
							params={{ slug: "new-form" }}
							search={{ template: template.slug }}
							aria-label={`Use ${template.title} template`}
						>
							Use template
						</Link>
					</Button>
				</CardFooter>
			</Card>
			<DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl">
				<DialogHeader className="shrink-0 gap-3 p-6 pr-12 text-left">
					<DialogTitle className="text-xl leading-7">
						{template.title}
					</DialogTitle>
					<DialogDescription>{template.description}</DialogDescription>
					<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						<Badge variant="secondary">{template.category}</Badge>
						<span>{fieldCount} fields</span>
						<span>{requiredCount} required</span>
					</div>
				</DialogHeader>
				<Separator />
				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
					<p className="mb-6 text-sm text-muted-foreground">
						Try the fields below. Preview answers aren’t saved or submitted.
					</p>
					<TemplateFormPreview template={template} />
				</div>
				<Separator />
				<DialogFooter className="shrink-0 p-4 sm:items-center sm:justify-between sm:px-6">
					<DialogClose asChild>
						<Button variant="outline" size="lg" className="h-11">
							Back to templates
						</Button>
					</DialogClose>
					<Button size="lg" className="h-11" asChild>
						<Link
							to="/dashboard/builder/$slug"
							params={{ slug: "new-form" }}
							search={{ template: template.slug }}
						>
							Use template
							<ArrowRightIcon data-icon="inline-end" />
						</Link>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function TemplateGallery({ compact = false }: { compact?: boolean }) {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("all");
	const searchId = useId();
	const templates = compact ? FORM_TEMPLATES.slice(0, 4) : FORM_TEMPLATES;
	const categories = [
		...new Set(templates.map((template) => template.category)),
	];
	const search = query.trim().toLowerCase();
	const filteredTemplates = templates.filter((template) => {
		const text = [
			template.title,
			template.description,
			template.category,
			...template.sections.flatMap((section) =>
				section.fields.map((field) => field.label),
			),
		]
			.join(" ")
			.toLowerCase();
		return (
			(category === "all" || template.category === category) &&
			text.includes(search)
		);
	});
	const clearFilters = () => {
		setQuery("");
		setCategory("all");
	};

	return (
		<div className="flex min-w-0 flex-col gap-5">
			{!compact && (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="relative flex-1 sm:max-w-md">
							<label htmlFor={searchId} className="sr-only">
								Search templates
							</label>
							<SearchIcon
								aria-hidden="true"
								className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id={searchId}
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search by name, purpose, or question…"
								className="h-11 pl-10"
							/>
						</div>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger
								aria-label="Template category"
								className="w-full data-[size=default]:h-11 sm:w-44"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="all">All categories</SelectItem>
									{categories.map((item) => (
										<SelectItem key={item} value={item}>
											{item}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex min-h-9 items-center justify-between gap-3 text-sm">
						<output className="text-muted-foreground">
							{filteredTemplates.length} template
							{filteredTemplates.length !== 1 ? "s" : ""}
							{category !== "all"
								? ` in ${category.toLowerCase()}`
								: " to start from"}
						</output>
						{(search || category !== "all") && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								Clear filters
							</Button>
						)}
					</div>
				</div>
			)}
			{filteredTemplates.length ? (
				<div
					className={cn(
						"grid grid-cols-1 gap-5",
						compact
							? "md:grid-cols-2 xl:grid-cols-3"
							: "@2xl/main:grid-cols-2 @5xl/main:grid-cols-3",
					)}
				>
					{filteredTemplates.map((template) => (
						<TemplateCard key={template.slug} template={template} />
					))}
				</div>
			) : (
				<div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
					<SearchIcon
						aria-hidden="true"
						className="size-6 text-muted-foreground"
					/>
					<h2 className="text-lg font-semibold">No matching templates</h2>
					<p className="max-w-sm text-sm leading-6 text-muted-foreground">
						Try another search or clear your filters to see all templates.
					</p>
					<Button variant="outline" onClick={clearFilters}>
						Show all templates
					</Button>
				</div>
			)}
		</div>
	);
}
