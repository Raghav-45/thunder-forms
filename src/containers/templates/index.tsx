import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Icons } from "#/components/Icons";
import { buttonVariants } from "#/components/ui/button";
import { Announcement } from "#/containers/templates/components/announcement";
import { PublicTemplateGallery } from "#/containers/templates/components/public-template-gallery";
import { cn } from "#/lib/utils";

export default function TemplatesPage() {
	return (
		<section className="py-24 md:py-32">
			<div className="container flex flex-col gap-12 md:gap-16">
				<div className="flex max-w-2xl flex-col gap-4">
					<Announcement
						text="✨ New Feedback Template"
						href="#template-customer-feedback"
						withoutIcon
					/>

					<h1 className="mt-1 flex items-center font-anton text-4xl leading-tight font-normal tracking-tight text-balance md:text-5xl">
						Choose a template
						<Icons.Logo className="mx-3 h-auto w-10" aria-hidden="true" />
					</h1>
					<p className="text-lg text-muted-foreground">
						Start with the right questions. Preview a template with live fields,
						then open it in the builder and make it yours.
					</p>
				</div>
				<PublicTemplateGallery />
				<div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-muted/40 p-6 sm:flex-row sm:items-center md:p-8">
					<div className="flex max-w-xl flex-col gap-1">
						<h2 className="text-lg font-semibold tracking-tight">
							Can’t find the right shape?
						</h2>
						<p className="text-sm leading-6 text-muted-foreground">
							Start from a blank form and add only the questions you need.
						</p>
					</div>
					<Link
						to="/dashboard/builder/$slug"
						params={{ slug: "new-form" }}
						search={{}}
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"h-11",
						)}
					>
						<PlusIcon data-icon="inline-start" />
						Start from scratch
					</Link>
				</div>
			</div>
		</section>
	);
}
