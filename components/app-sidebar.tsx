'use client'

import { NavMain } from '@/components/nav-main'
import { NavOther } from '@/components/nav-other'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { siteConfig } from '@/config/site'
import { createClient } from '@/utils/supabase/client'
import {
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react'
import * as React from 'react'

const data = {
  user: {
    name: 'Raghav',
    email: 'raghav@thunderforms.com',
    avatar: 'https://github.com/raghav-45.png',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'My Forms',
      url: '/dashboard/forms',
      icon: IconListDetails,
    },
  ],
  navSecondary: [
    {
      name: 'Template Library',
      url: '/dashboard/templates',
      icon: IconDatabase,
    },
    {
      name: 'Reports',
      url: '#',
      icon: IconReport,
    },
    {
      name: 'Word Assistant',
      url: '#',
      icon: IconFileWord,
    },
  ],
  navOther: [
    {
      title: 'Settings',
      url: '#',
      icon: IconSettings,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<typeof data.user>()

  React.useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        console.log(userData)
        setUser({
          name: userData.user.user_metadata?.full_name,
          email: userData.user.email || '',
          avatar: userData.user.user_metadata?.avatar_url || data.user.avatar,
        })
      }
    }

    loadUser()
  }, [])
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href={siteConfig.url}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  {siteConfig.name}
                </span>
              </a>
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
