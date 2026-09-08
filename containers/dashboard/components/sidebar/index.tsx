import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  IconCirclePlusFilled,
  IconMail
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentType, FC } from 'react'
import { sidebarSections } from '../../constants'

interface DashboardSidebarProps {}

interface SidebarNavItemProps {
  item: {
    title: string
    url: string
    icon?: ComponentType
  }
  isActive: boolean
}

const SidebarNavItem: FC<SidebarNavItemProps> = ({ item, isActive }) => (
  <SidebarMenuItem>
    <SidebarMenuButton tooltip={item.title} asChild>
      <Link href={item.url} className={cn(isActive ? 'bg-sidebar-accent' : '')}>
        {item.icon && <item.icon />}
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)

export const DashboardSidebar: FC<DashboardSidebarProps> = ({}) => {
  const pathname = usePathname()
  const checkIsActive = (link: string) => {
    const isActive = pathname === link
    return isActive
  }
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <Link href="/dashboard/builder/new-form" className="w-full">
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled />
                  <span>New Form</span>
                </SidebarMenuButton>
              </Link>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {sidebarSections[0].items.map((item) => (
              <SidebarNavItem key={item.title} item={item} isActive={checkIsActive(item.url)} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {sidebarSections.slice(1).map((section, index) => (
        <SidebarGroup
          key={section.label ?? index}
          className={cn(
            'group-data-[collapsible=icon]:hidden',
            index === sidebarSections.length - 2 && 'mt-auto',
          )}
        >
          <SidebarGroupContent>
            {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {/* //NOTE: The following code is commented out because it was not being
              used as we dont have lots of items to display. It can be uncommented
              and used later if needed. */}
              {/* <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <IconDots className="text-sidebar-foreground/70" />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
              {section.items.map((item) => (
                <SidebarNavItem key={item.title} item={item} isActive={checkIsActive(item.url)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
