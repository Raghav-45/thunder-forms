import { TemplateGallery } from '@/components/template-gallery'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

export default function TemplatesPage() {
  return (
    <div className="px-4 lg:px-6">
      <TemplateGallery />
      <div className="mt-6 flex justify-center">
        <Button asChild>
          <Link href="/dashboard/builder/new-form">
            <PlusIcon className="mr-2 h-4 w-4" />
            Or start from scratch
          </Link>
        </Button>
      </div>
    </div>
  )
}
