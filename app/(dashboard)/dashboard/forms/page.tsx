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
  maxSubmissions: string
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

function transformFormsData(
  apiData: ApiFormData[]
): z.infer<typeof TableDataItemSchema>[] {
  return apiData.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    status: form._count.responses > 0 ? 'Active' : 'Done',
    responses: form._count.responses,
    createdAt: format(new Date(form.createdAt), 'PPP'),
  }))
}

export default function FormsPage() {
  const {
    data: apiData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  })

  // Transform data when available
  const transformedData = apiData ? transformFormsData(apiData) : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading forms...
      </div>
    )
  }

  if (error) {
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
      ? error.message
      : 'Failed to fetch forms'

    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500 space-y-4">
        <div>Error: {errorMessage}</div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefetching ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    )
  }

  return <FormTable data={transformedData} />
}
