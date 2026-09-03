'use client'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import {
  FormTable,
  schema as TableDataItemSchema,
} from '@/components/form-table'
import { SectionCards } from '@/components/section-cards'
import { TemplateGallery } from '@/components/template-gallery'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'
import Link from 'next/link'
import { z } from 'zod'

interface ApiFormData {
  id: string
  title: string
  description: string
  createdAt: string
  expiresAt: string | null
  maxSubmissions: number | null
  _count: {
    responses: number
  }
}

const getForms = async (): Promise<ApiFormData[]> => {
  const response = await axios.get<ApiFormData[]>('/api/forms', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

function getFormStatus(responseCount: number, maxSubmissions: number | null, expiresAt: string | null): string {
  const hasExpired = expiresAt && new Date(expiresAt) < new Date()
  const hasReachedMaxSubmissions = maxSubmissions !== null && maxSubmissions > 0 && responseCount >= maxSubmissions
  
  // Determine status based on conditions
  if (hasExpired && hasReachedMaxSubmissions) {
    return 'Closed | Expired & Completed'
  }
  
  if (hasExpired) {
    return 'Closed | Expired'
  }
  
  if (hasReachedMaxSubmissions) {
    return 'Closed | Completed'
  }
  
  // Active status - different format based on whether form has max submissions
  if (maxSubmissions !== null && maxSubmissions > 0) {
    // Form has max submissions - show percentage
    const completionPercentage = Math.min(Math.round((responseCount / maxSubmissions) * 100), 100)
    return `Active | ${completionPercentage}% Completed`
  } else {
    // Form has no max submissions - show response count
    return `Active | ${responseCount} Response${responseCount !== 1 ? 's' : ''}`
  }
}

function transformFormsData(
  apiData: ApiFormData[]
): z.infer<typeof TableDataItemSchema>[] {
  return apiData.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    status: getFormStatus(form._count.responses, form.maxSubmissions, form.expiresAt),
    responses: form._count.responses,
    createdAt: format(new Date(form.createdAt), 'PPP'),
  }))
}

const createSkeletonData = (
  count: number
): z.infer<typeof TableDataItemSchema>[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `skeleton-${index}`,
    title: '',
    description: '',
    status: '',
    responses: 0,
    createdAt: '',
  }))
}

export default function TestPage() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  })

  // Transform data when available, or use skeleton data when loading
  const transformedData = apiData ? transformFormsData(apiData) : []
  const displayData = isLoading ? createSkeletonData(5) : transformedData
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <div className="px-4 lg:px-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Start from a template
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pick a pre-built form and customize it in the builder.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/templates">View all</Link>
                </Button>
              </div>
              <TemplateGallery compact />
            </div>
            <FormTable data={displayData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
