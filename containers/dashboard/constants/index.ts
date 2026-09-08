import {
  IconDashboard,
  IconDatabase,
  IconListDetails,
  IconSettings,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'

interface SidebarItem {
  title: string
  url: string
  icon: ComponentType
}

interface SidebarSection {
  label?: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    items: [
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
  },
  {
    label: 'Repository',
    items: [
      {
        title: 'Template Library',
        url: '/dashboard/templates',
        icon: IconDatabase,
      },
    ],
  },
  {
    items: [
      {
        title: 'Settings',
        url: '#',
        icon: IconSettings,
      },
    ],
  },
] as const
