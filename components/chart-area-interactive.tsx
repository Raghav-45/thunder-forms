'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Skeleton } from '@/components/ui/skeleton'

export const description = 'An interactive area chart showing analytics for all forms'

interface TimeSeriesData {
  date: string
  views: number
  visits: number
  visitors: number
}

interface OverallAnalytics {
  timeSeriesData: TimeSeriesData[]
}

const getOverallAnalytics = async (): Promise<OverallAnalytics> => {
  const response = await axios.get('/api/analytics/overview')
  return response.data.analytics
}

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  visits: {
    label: 'Visits',
    color: 'var(--chart-1)',
  },
  views: {
    label: 'Views',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState('90d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['overall-analytics-chart'],
    queryFn: getOverallAnalytics,
  })

  const filteredData = React.useMemo(() => {
    if (!analytics?.timeSeriesData || analytics.timeSeriesData.length === 0) {
      return []
    }

    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === '30d') {
      daysToSubtract = 30
    } else if (timeRange === '7d') {
      daysToSubtract = 7
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return analytics.timeSeriesData
      .filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate
      })
      .map((item) => ({
        date: item.date,
        visits: item.visits,
        views: item.views,
      }))
  }, [analytics, timeRange])

  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-[160px]" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const timeRangeLabel = timeRange === '90d' 
    ? 'Last 3 months' 
    : timeRange === '30d' 
    ? 'Last 30 days' 
    : 'Last 7 days'

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Total Visitors</CardTitle>
          <CardDescription>
            Showing total visitors for {timeRangeLabel.toLowerCase()}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] w-full items-center justify-center text-sm text-muted-foreground">
            No analytics data available for the selected period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-visits)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-visits)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-views)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-views)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="views"
                type="monotoneX"
                fill="url(#fillViews)"
                stroke="var(--color-views)"
                stackId="a"
              />
              <Area
                dataKey="visits"
                type="monotoneX"
                fill="url(#fillVisits)"
                stroke="var(--color-visits)"
                stackId="b"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
