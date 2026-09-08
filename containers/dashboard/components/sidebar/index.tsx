import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  IconCirclePlusFilled,
  IconDots,
  IconFolder,
  IconMail,
  IconShare3,
  IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentType, FC } from 'react'
import { sidebarLinks } from '../../constants'

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
  const { isMobile } = useSidebar()
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
            {sidebarLinks.navMain.map((item) => (
              <SidebarNavItem
                key={item.title}
                item={item}
                isActive={checkIsActive(item.url)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <SidebarGroupLabel>Repository</SidebarGroupLabel>
          <SidebarMenu>
            {sidebarLinks.navSecondary.map((item) => (
              <SidebarNavItem key={item.title} item={item} isActive={checkIsActive(item.url)} />
            ))}
            {/* //NOTE: The following code is commented out because it was not being
            used as we dont have lots of items to display. It can be uncommented
            and used later if needed. */}
            {/* <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <IconDots className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {sidebarLinks.navOther.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
