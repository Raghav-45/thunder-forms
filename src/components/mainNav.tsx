import { Link, useLocation } from "@tanstack/react-router";
import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { siteConfig } from "../config/site";

export function MainNav() {
	const { pathname } = useLocation();

	return (
		<div className="mr-4 hidden md:flex">
			<Link to="/" className="mr-6 flex items-center space-x-2">
				<Icons.Logo className="h-7 w-7 mr-1" />
				<span className="font-semibold text-lg">{siteConfig.name}</span>
			</Link>
			<nav className="ml-6 flex items-center gap-4 text-sm lg:gap-6">
				<Link
					to="/dashboard/builder/$slug"
					params={{ slug: "new-form" }}
					className={cn(
						"transition-colors hover:text-foreground/80",
						pathname?.startsWith("/dashboard/builder")
							? "text-foreground"
							: "text-foreground/60",
					)}
				>
					Build a form
				</Link>
				<Link
					to="/templates"
					className={cn(
						"transition-colors hover:text-foreground/80 flex",
						pathname?.startsWith("/templates")
							? "text-foreground"
							: "text-foreground/60",
					)}
				>
					Templates{" "}
					{!pathname?.startsWith("/templates") && (
						<Badge
							variant="outline"
							className="ml-1 h-full bg-blue-500 px-1.5 py-0.5 text-blue-100 align-middle text-xs leading-none"
						>
							new
						</Badge>
					)}
				</Link>
				{/* <Link
          href="/pricing"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/pricing')
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          Pricing
        </Link> */}
			</nav>
		</div>
	);
}
