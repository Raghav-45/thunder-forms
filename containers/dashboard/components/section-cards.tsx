'use client'

import MetricCard, { MetricCardProps } from './MetricCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface OverallAnalytics {
  totalViews: number
  totalVisits: number
  totalVisitors: number
  totalForms: number
  totalResponses: number
  averageBounceRate: number
  averageVisitDuration: number
}

const getOverallAnalytics = async (): Promise<OverallAnalytics> => {
  const response = await axios.get('/api/analytics/overview')
  return response.data.analytics
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function SectionCards() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['overall-analytics'],
    queryFn: getOverallAnalytics,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-xs">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-20 mb-4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Forms',
      value: analytics?.totalForms.toLocaleString() || '0',
      description: 'Total Forms',
      trend: {
        direction: 'up',
        percentage: `${analytics?.totalForms || 0}`,
        label: 'Active forms in your account',
      },
      footer: {
        summary: 'Active forms in your account',
        details: 'All forms created',
      },
    },
    {
      title: 'Total Responses',
      value: analytics?.totalResponses.toLocaleString() || '0',
      description: 'Total Responses',
      trend: {
        direction: 'up',
        percentage: `${analytics?.totalResponses || 0}`,
        label: 'Form submissions received',
      },
      footer: {
        summary: 'Form submissions received',
        details: 'Across all forms',
      },
    },
    {
      title: 'Total Visitors',
      value: analytics?.totalVisitors.toLocaleString() || '0',
      description: 'Unique Visitors',
      trend: {
        direction: 'up',
        percentage: `${analytics?.totalVisits || 0} visits`,
        label: `${analytics?.totalVisits || 0} total visits`,
      },
      footer: {
        summary: `${analytics?.totalVisits || 0} total visits`,
        details: 'Unique sessions tracked',
      },
    },
    {
      title: 'Avg. Visit Duration',
      value: formatDuration(analytics?.averageVisitDuration || 0),
      description: 'Average Visit Duration',
      trend: {
        direction: analytics && analytics.averageBounceRate < 50 ? 'up' : 'down',
        percentage: `${analytics?.averageBounceRate.toFixed(1) || 0}% bounce`,
        label: `${analytics?.averageBounceRate.toFixed(1) || 0}% bounce rate`,
      },
      footer: {
        summary: `${analytics?.averageBounceRate.toFixed(1) || 0}% bounce rate`,
        details: 'Average time on forms',
      },
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((card, index) => (
        <MetricCard key={index} data={card} />
      ))}
    </div>
  )
}
