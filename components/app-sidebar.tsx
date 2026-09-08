"use client"

import { NavMain } from "@/components/nav-main"
import { NavOther } from "@/components/nav-other"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { siteConfig } from "@/config/site"
import { authClient } from "@/lib/auth-client"
import {
  IconDashboard,
  IconDatabase,
  IconListDetails,
  IconSettings,
} from "@tabler/icons-react"
import Link from "next/link"
import * as React from "react"
import { Icons } from "./Icons"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My Forms",
      url: "/dashboard/forms",
      icon: IconListDetails,
    },
  ],
  navSecondary: [
    {
      title: "Template Library",
      url: "/dashboard/templates",
      icon: IconDatabase,
    },
  ],
  navOther: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()

  const user = session?.user
    ? {
        name: (session.user as any).displayName || session.user.name,
        email: session.user.email,
        avatar: session.user.image || "",
      }
    : undefined

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                href={siteConfig.url}
                className="flex items-center gap-2 self-center"
              >
                <Icons.Logo className="!size-5" />
                <span className="text-base font-semibold">
                  {siteConfig.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} />
        <NavOther items={data.navOther} className="mt-auto" />
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
