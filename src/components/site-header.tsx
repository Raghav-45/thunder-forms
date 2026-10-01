import { Link } from "@tanstack/react-router";
import { TerminalIcon, UserCircle2Icon } from "lucide-react";
import { MainNav } from "#/components/mainNav";
import { buttonVariants } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { cn } from "#/lib/utils";

export function SiteHeader() {
	const { data: session } = authClient.useSession();
	const isLoggedIn = !!session?.user;

	return (
		<header className="absolute top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 max-w-screen-2xl items-center">
				<MainNav />
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<nav className="flex items-center space-x-2">
						{isLoggedIn ? (
							<Link
								to="/dashboard"
								className={cn(
									buttonVariants({
										variant: "secondary",
										size: "sm",
									}),
									"mr-1",
								)}
							>
								<TerminalIcon className="size-4" />
								Go to dashboard
							</Link>
						) : (
							<Link
								to="/auth/login"
								className={cn(
									buttonVariants({
										variant: "secondary",
										size: "sm",
									}),
									"mr-1",
								)}
							>
								<UserCircle2Icon className="size-4" />
								Login
							</Link>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}
