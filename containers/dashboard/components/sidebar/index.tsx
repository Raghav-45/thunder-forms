import { FC } from 'react'
import { sidebarLinks } from '../../constants'
import { NavMain } from './nav-main'
import { NavOther } from './nav-other'
import { NavSecondary } from './nav-secondary'

interface DashboardSidebarProps {}

export const DashboardSidebar: FC<DashboardSidebarProps> = ({}) => {
  return (
    <>
      <NavMain items={sidebarLinks.navMain} />
      <NavSecondary items={sidebarLinks.navSecondary} />
      <NavOther items={sidebarLinks.navOther} className="mt-auto" />
    </>
  )
}
