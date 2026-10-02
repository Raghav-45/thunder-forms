import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { TemplateGallery } from "#/containers/dashboard/templates/components/template-gallery";

const TemplatesPage = () => {
	return (
		<div className="flex flex-1 flex-col">
			<div className="@container/main mx-auto flex w-full max-w-screen-2xl flex-1 flex-col">
				<div className="flex flex-col gap-6 px-4 py-5 md:gap-8 md:px-8 md:py-8">
					<div className="flex flex-col gap-4 md:gap-5 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex max-w-2xl flex-col gap-2 md:gap-3">
							<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
								A head start for your next form.
							</h1>
							<p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
								Start with the right questions. Customize the details in the
								builder.
							</p>
						</div>
						<Button
							variant="outline"
							asChild
							className="h-11 self-start lg:shrink-0"
						>
							<Link
								to="/dashboard/builder/$slug"
								params={{ slug: "new-form" }}
								search={{}}
							>
								<PlusIcon data-icon="inline-start" />
								Start from scratch
							</Link>
						</Button>
					</div>
					<TemplateGallery />
				</div>
			</div>
		</div>
	);
};

export default TemplatesPage;
