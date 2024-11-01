import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { LayoutPanelTopIcon } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

export function Announcement() {
  return (
    <Link
      href="/templates"
      className="group inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium"
    >
      <LayoutPanelTopIcon className="h-4 w-4" />{' '}
      <Separator className="mx-1 h-4" orientation="vertical" />{' '}
      <span>Introducing New SaaS Template</span>
      <ArrowRightIcon className="ml-2 h-4 w-4 -translate-x-0.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
