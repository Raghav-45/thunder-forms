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

// Generate full day intervals with zero impressions starting from 11PM
const generateFullDayIntervals = (
  intervalMinutes = 15
): GroupedImpression[] => {
  const intervals: GroupedImpression[] = []
  const totalMinutes = 24 * 60 // Full day in minutes
  const startHour = 23 // Start from 11PM

  for (let minutes = 0; minutes < totalMinutes; minutes += intervalMinutes) {
    const totalHours = Math.floor(minutes / 60)
    const currentHour = (startHour + totalHours) % 24

    const timeString =
      currentHour === 0
        ? '12AM'
        : currentHour < 12
        ? `${currentHour}AM`
        : currentHour === 12
        ? '12PM'
        : `${currentHour - 12}PM`

    intervals.push({
      time: timeString,
      impressions: 0,
    })
  }

  return intervals
}

const groupImpressionsByInterval = (
  data: AnalyticsData[],
  intervalMinutes = 15
): GroupedImpression[] => {
  // Start with a full day of zero impressions from 11PM
  const fullDayIntervals = generateFullDayIntervals(intervalMinutes)

  if (!data.length) return fullDayIntervals

  // Create a map for easy lookup and updating
  const intervalMap = new Map<string, number>()
  fullDayIntervals.forEach((interval) => {
    intervalMap.set(interval.time, 0)
  })

  // Process actual data and increment counters
  data.forEach((item) => {
    const date = new Date(item.created_at)
    const hours = date.getHours()
    const minutes = date.getMinutes()

    // Round down to nearest interval
    const intervalStart =
      Math.floor(minutes / intervalMinutes) * intervalMinutes
    const intervalHour = intervalStart === 60 ? hours + 1 : hours

    const timeKey =
      intervalHour === 0
        ? '12AM'
        : intervalHour < 12
        ? `${intervalHour}AM`
        : intervalHour === 12
        ? '12PM'
        : `${intervalHour - 12}PM`

    if (intervalMap.has(timeKey)) {
      intervalMap.set(timeKey, intervalMap.get(timeKey)! + 1)
    }
  })

  // Convert back to array format maintaining the order from 11PM onwards
  return fullDayIntervals.map((interval) => ({
    time: interval.time,
    impressions: intervalMap.get(interval.time) || 0,
  }))
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
  className?: string
}

const AnalyticsGraph: FC<AnalyticsGraphProps> = ({
  formId,
  data,
  rawData,
  intervalMinutes = 15,
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

  // Process data - use provided data or process rawData/fetchedData, fallback to full day with zeros
  const processedData =
    data ||
    (rawData
      ? groupImpressionsByInterval(rawData, intervalMinutes)
      : fetchedData
      ? groupImpressionsByInterval(fetchedData, intervalMinutes)
      : generateFullDayIntervals(intervalMinutes))

  // Calculate total impressions for trend analysis
  const totalImpressions = processedData.reduce(
    (sum, item) => sum + item.impressions,
    0
  )

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
            left: 16,
            right: 10,
            top: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={true}
            axisLine={true}
            tickMargin={8}
            interval={2}
            tickFormatter={(value) => value} // Show full time format
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="impressions"
            // type="natural"
            // type="linear"
            // type="bump"
            type="step"
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
          Impressions in 24 Hours : {totalImpressions}
          <IconTrendingUp className="size-4 -translate-y-1" />
        </div>
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
