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
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const description =
  'An interactive area chart showing analytics for all forms'

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
    color: 'var(--primary)',
  },
  views: {
    label: 'Views',
    color: '#ff822d',
  },
} satisfies ChartConfig

/**
 * Generate empty time series data for when no analytics exist
 */
function generateEmptyTimeSeriesData(timeRange: string) {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let days = 90
  if (timeRange === '30d') {
    days = 30
  } else if (timeRange === '7d') {
    days = 7
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    result.push({
      date: date.toISOString().split('T')[0],
      visits: 0,
      views: 0,
    })
  }

  return result
}

/**
 * Fill in missing dates with zero values for continuous chart display
 */
function fillMissingDatesInRange(data: TimeSeriesData[], days: number) {
  if (data.length === 0) {
    return generateEmptyTimeSeriesData(
      days === 7 ? '7d' : days === 30 ? '30d' : '90d'
    )
  }

  // Create a map for quick lookup
  const dataMap = new Map<string, TimeSeriesData>()
  data.forEach((item) => {
    dataMap.set(item.date, item)
  })

  // Generate all dates for the range
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]

    if (dataMap.has(dateKey)) {
      result.push({
        date: dateKey,
        visits: dataMap.get(dateKey)!.visits,
        views: dataMap.get(dateKey)!.views,
      })
    } else {
      result.push({
        date: dateKey,
        visits: 0,
        views: 0,
      })
    }
  }

  return result
}

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState('90d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['overall-analytics-chart'],
    queryFn: getOverallAnalytics,
  })

  const filteredData = React.useMemo(() => {
    if (!analytics?.timeSeriesData || analytics.timeSeriesData.length === 0) {
      // Generate empty data for the selected time range
      return generateEmptyTimeSeriesData(timeRange)
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
    startDate.setHours(0, 0, 0, 0)

    // Filter data within the time range
    const filteredItems = analytics.timeSeriesData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate
    })

    // Fill in any missing dates within the filtered range
    return fillMissingDatesInRange(filteredItems, daysToSubtract)
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

  const timeRangeLabel =
    timeRange === '90d'
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
                type="monotone"
                fill="url(#fillViews)"
                stroke="var(--color-views)"
                stackId="a"
              />
              <Area
                dataKey="visits"
                type="monotone"
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
