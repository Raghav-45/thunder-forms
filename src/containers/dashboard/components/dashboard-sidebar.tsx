import { Icons } from "#/components/Icons";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";
import { siteConfig } from "#/config/site";
import { SidebarSections } from "#/containers/dashboard/components/sidebar";
import { NavUser } from "#/containers/dashboard/components/sidebar/nav-user";
import { authClient } from "#/lib/auth-client";

export function DashboardSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();

	const user = session?.user
		? {
				name: (session.user as any).displayName || session.user.name,
				email: session.user.email,
				avatar: session.user.image || "",
			}
		: undefined;

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<a
								href={siteConfig.url}
								className="flex items-center gap-2 self-center"
							>
								<Icons.Logo className="!size-5" />
								<span className="text-base font-semibold">
									{siteConfig.name}
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarSections />
			</SidebarContent>
			{user && (
				<SidebarFooter>
					<NavUser user={user} />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
