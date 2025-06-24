'use client'

import {
  FormTable,
  schema as TableDataItemSchema,
} from '@/components/form-table'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
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
  try {
    const response = await fetch('/api/forms', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch forms: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching forms:', error)
    throw error
  }
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
  const [data, setData] = useState<z.infer<typeof TableDataItemSchema>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true)
        const apiData = await getForms()
        const transformedData = transformFormsData(apiData)
        setData(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch forms')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading forms...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        Error: {error}
      </div>
    )
  }

  return (
    <>
      <FormTable data={data} />
    </>
  )
}
