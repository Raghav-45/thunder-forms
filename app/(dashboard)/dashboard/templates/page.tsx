import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { FileTextIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'

export default function TemplatesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>No Templates Available</EmptyTitle>
                <EmptyDescription>
                  The template library is currently empty. Check back soon for
                  pre-built form templates to help you get started quickly.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href="/dashboard/builder/new-form">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Custom Form
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </div>
        </div>
      </div>
    </div>
  )
}
