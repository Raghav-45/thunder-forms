import {
  IconDashboard,
  IconDatabase,
  IconListDetails,
  IconSettings,
} from "@tabler/icons-react"

export const sidebarLinks = {
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
      name: "Template Library",
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