import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { IconTrendingUp } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { FC } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

// Sample chart data - replace with your actual data
const defaultChartData = [
  { time: '09:42', impressions: 3 },
  { time: '10:14', impressions: 1 },
  { time: '10:56', impressions: 1 },
  { time: '11:38', impressions: 4 },
  { time: '12:15', impressions: 1 },
]

// Types for the analytics data
type AnalyticsData = {
  url_path: string
  created_at: string
}

type GroupedImpression = {
  time: string // "HH:mm"
  impressions: number
}

// API fetch function
async function fetchAnalyticsData(formId: string): Promise<AnalyticsData[]> {
  const response = await fetch(`/api/analytics/forms/${formId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  const data = await response.json()
  return data.analytics
}

function groupImpressionsByInterval(
  data: AnalyticsData[],
  intervalMinutes = 15
): GroupedImpression[] {
  if (!data.length) return []

  // Sort by time ascending
  const sorted = [...data].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const groups: GroupedImpression[] = []
  let groupStartTime = new Date(sorted[0].created_at)
  let count = 1

  for (let i = 1; i < sorted.length; i++) {
    const currentTime = new Date(sorted[i].created_at)
    const diffMinutes =
      (currentTime.getTime() - groupStartTime.getTime()) / (1000 * 60)

    if (diffMinutes <= intervalMinutes) {
      count++
    } else {
      groups.push({
        time: groupStartTime.toISOString().substring(11, 16), // "HH:mm"
        impressions: count,
      })
      groupStartTime = currentTime
      count = 1
    }
  }

  // Push last group
  groups.push({
    time: groupStartTime.toISOString().substring(11, 16),
    impressions: count,
  })

  return groups
}
const chartConfig = {
  impressions: {
    label: 'Impressions',
    color: 'var(--primary)',
  },
}

interface AnalyticsGraphProps {
  formId: string
  data?: GroupedImpression[]
  rawData?: AnalyticsData[]
  intervalMinutes?: number
  trendPercentage?: number
  className?: string
}

const AnalyticsGraph: FC<AnalyticsGraphProps> = ({
  formId,
  data,
  rawData,
  intervalMinutes = 15,
  trendPercentage = 5.2,
  className = '',
}) => {
  // Fetch analytics data using TanStack Query
  const {
    data: fetchedData,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['analytics', formId],
    queryFn: () => fetchAnalyticsData(formId),
    enabled: !!formId && !data && !rawData, // Only fetch if formId exists and no data provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Process data - use provided data or process rawData/fetchedData, fallback to default
  const processedData =
    data ||
    (rawData
      ? groupImpressionsByInterval(rawData, intervalMinutes)
      : fetchedData
      ? groupImpressionsByInterval(fetchedData, intervalMinutes)
      : defaultChartData)

  // Calculate total impressions for trend analysis
  const totalImpressions = processedData.reduce(
    (sum, item) => sum + item.impressions,
    0
  )
  const avgImpressions = totalImpressions / processedData.length

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="h-64 flex items-center justify-center bg-muted/20 rounded-md">
          <div className="text-sm text-muted-foreground">
            Loading analytics data...
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (isError) {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="h-64 flex items-center justify-center bg-destructive/10 rounded-md">
          <div className="text-sm text-destructive">
            Error loading analytics data: {error?.message || 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      {/* Chart */}
      <ChartContainer config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={processedData}
          margin={{
            left: 0,
            right: 10,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value} // Show full time format
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="impressions"
            type="natural"
            fill="var(--color-impressions)"
            fillOpacity={0.4}
            stroke="var(--color-impressions)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>

      {/* Trend Information */}
      <Separator />
      <div className="grid gap-2">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by {trendPercentage}% this month{' '}
          <IconTrendingUp className="size-4" />
        </div>
        {/* <div className="text-muted-foreground text-sm">
          Total impressions: {totalImpressions} | Average:{' '}
          {avgImpressions.toFixed(1)} per interval
        </div> */}
        <div className="text-muted-foreground text-sm">
          Showing total visitors for the last 6 months. This is just some random
          text to test the layout. It spans multiple lines and should wrap
          around.
        </div>
      </div>
      <Separator />
    </div>
  )
}

export default AnalyticsGraph
