'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'
import type { FormTableRow } from '../types/form'

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

function getFormStatus(
  responseCount: number,
  maxSubmissions: number | null,
  expiresAt: string | null,
): string {
  const hasExpired = expiresAt && new Date(expiresAt) < new Date()
  const hasReachedMaxSubmissions =
    maxSubmissions !== null &&
    maxSubmissions > 0 &&
    responseCount >= maxSubmissions

  if (hasExpired && hasReachedMaxSubmissions) {
    return 'Closed | Expired & Completed'
  }
  if (hasExpired) return 'Closed | Expired'
  if (hasReachedMaxSubmissions) return 'Closed | Completed'

  if (maxSubmissions !== null && maxSubmissions > 0) {
    const completionPercentage = Math.min(
      Math.round((responseCount / maxSubmissions) * 100),
      100,
    )
    return `Active | ${completionPercentage}% Completed`
  }

  return `Active | ${responseCount} Response${responseCount !== 1 ? 's' : ''}`
}

function transformFormsData(apiData: ApiFormData[]): FormTableRow[] {
  return apiData.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    status: getFormStatus(
      form._count.responses,
      form.maxSubmissions,
      form.expiresAt,
    ),
    responses: form._count.responses,
    createdAt: format(new Date(form.createdAt), 'PPP'),
  }))
}

function createSkeletonData(count: number): FormTableRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `skeleton-${index}`,
    title: '',
    description: '',
    status: '',
    responses: 0,
    createdAt: '',
  }))
}

export function useForms() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  })

  const forms = apiData ? transformFormsData(apiData) : []

  return {
    forms: isLoading ? createSkeletonData(5) : forms,
    isLoading,
  }
}
