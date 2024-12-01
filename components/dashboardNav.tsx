'use client'

import React, { FC } from 'react'
import Link from 'next/link'
import { FileText, Home } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface DashboardNavProps {}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/forms', label: 'My Forms', icon: FileText }, // To view and manage created forms
  // { href: '/dashboard/responses', label: 'Responses', icon: CheckCircle }, // To view form submissions
  // { href: '/dashboard/templates', label: 'Templates', icon: FilePlus }, // For pre-made form templates
  // { href: '#', label: 'Analytics', icon: LineChart },
]

const DashboardNav: FC<DashboardNavProps> = ({}) => {
  const pathname = usePathname()
  return (
    <React.Fragment>
      {navLinks.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href

        return (
          <Tooltip key={link.href}>
            <TooltipTrigger asChild>
              <Link
                href={link.href}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{link.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{link.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </React.Fragment>
  )
}

const DashboardBreadcrumb = ({}) => {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`
          const isLast = index === pathSegments.length - 1
          const label = segment.charAt(0).toUpperCase() + segment.slice(1)

          return (
            <BreadcrumbItem key={href}>
              {!isLast ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default DashboardNav
export { DashboardBreadcrumb }
