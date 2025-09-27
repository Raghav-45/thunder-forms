'use client'

import {
  FormTable,
  schema as TableDataItemSchema,
} from '@/components/form-table'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'
import { z } from 'zod'

interface ApiFormData {
  id: string
  title: string
  description: string
  createdAt: string
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

function getFormStatus(responseCount: number, maxSubmissions: number | null): string {
  if (maxSubmissions !== null && maxSubmissions > 0 && responseCount >= maxSubmissions) {
    return 'Closed'
  }
  
  return 'Active'
}

function transformFormsData(
  apiData: ApiFormData[]
): z.infer<typeof TableDataItemSchema>[] {
  return apiData.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    status: getFormStatus(form._count.responses, form.maxSubmissions),
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

export default function FormsPage() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  })

  // Transform data when available, or use skeleton data when loading
  const transformedData = apiData ? transformFormsData(apiData) : []
  const displayData = isLoading ? createSkeletonData(5) : transformedData

  return <FormTable data={displayData} isLoading={isLoading} />
}
