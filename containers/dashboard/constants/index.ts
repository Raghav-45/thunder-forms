import {
  IconDashboard,
  IconDatabase,
  IconListDetails,
  IconSettings,
} from '@tabler/icons-react'

export const sidebarSections = [
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
