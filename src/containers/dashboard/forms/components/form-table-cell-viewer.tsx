import { Link } from "@tanstack/react-router";
import { ChartLineIcon, DatabaseIcon, Edit2Icon } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "#/components/ui/drawer";
import { AnalyticsGraph } from "#/containers/dashboard/forms/components/analytics-graph";
import type { FormTableRow } from "#/containers/dashboard/forms/types/form";
import { useIsMobile } from "#/hooks/use-mobile";

interface FormTableCellViewerProps {
	item: FormTableRow;
}

export function FormTableCellViewer({ item }: FormTableCellViewerProps) {
	const isMobile = useIsMobile();

	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button
					variant="link"
					className="text-foreground w-fit px-0 text-left cursor-pointer"
				>
					{item.title}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>{item.title}</DrawerTitle>
					<DrawerDescription>
						Showing total impressions for the last 24 Hours
					</DrawerDescription>
				</DrawerHeader>
				<AnalyticsGraph formId={item.id} intervalMinutes={60} />
				<DrawerFooter>
					<div className="flex flex-row gap-2 w-full">
						<Link
							to="/dashboard/builder/$slug"
							params={{ slug: item.id }}
							className="flex-1"
						>
							<Button className="w-full cursor-pointer">
								<Edit2Icon />
								Edit Form
							</Button>
						</Link>
						<Link
							to="/dashboard/forms/$formId/analytics"
							params={{ formId: item.id }}
							className="flex-1"
						>
							<Button variant="secondary" className="w-full cursor-pointer">
								<ChartLineIcon />
								View Detailed Analytics
							</Button>
						</Link>
					</div>
					<DrawerClose asChild>
						<Link
							to="/dashboard/forms/$formId/responses"
							params={{ formId: item.id }}
							className="flex-1"
						>
							<Button variant="outline" className="w-full cursor-pointer">
								<DatabaseIcon />
								View Responses
							</Button>
						</Link>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
