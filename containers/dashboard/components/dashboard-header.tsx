'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'

const PAGE_LABELS: Record<string, string> = {
  analytics: 'Analytics',
  forms: 'Forms',
  responses: 'Responses',
  templates: 'Templates',
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const items = [{ href: '/dashboard', label: 'Dashboard' }]

  if (segments[1] === 'forms') {
    items.push({ href: '/dashboard/forms', label: 'Forms' })

    const page = segments.at(-1)
    if (page && PAGE_LABELS[page] && page !== 'forms') {
      items.push({ href: pathname, label: PAGE_LABELS[page] })
    }
  } else if (segments[1] === 'templates') {
    items.push({ href: '/dashboard/templates', label: 'Templates' })
  }

  return items
}

export function DashboardHeader() {
  const pathname = usePathname()
  const breadcrumbItems = getBreadcrumbItems(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isCurrentPage = index === breadcrumbItems.length - 1

              return (
                <Fragment key={item.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isCurrentPage ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
