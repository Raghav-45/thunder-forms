'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useParams } from 'next/navigation'

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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export const description = 'Form analytics chart showing daily views and visits'

const chartConfig = {
  views: {
    label: 'Views',
    color: 'oklch(0.488 0.243 264.376 / 0.4)',
  },
  visits: {
    label: 'Visits',
    color: 'oklch(0.488 0.243 264.376)',
  },
} satisfies ChartConfig

interface DailyViewData {
  date: string
  views: number
  visits: number
}

interface AnalyticsData {
  dailyViews: DailyViewData[]
}

// Custom bar shape to snap to whole pixels and reduce anti-aliasing gaps when overlapping
type OverlayBarProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

function OverlayBar(props: OverlayBarProps) {
  const { x, y, width, height, fill } = props
  const rx = Math.round(x ?? 0)
  const ry = Math.round(y ?? 0)
  const w = Math.round(width ?? 0)
  const h = Math.round(height ?? 0)
  // Use small corner radius similar to Bar's radius prop
  const corner = 2
  return (
    <rect x={rx} y={ry} width={w} height={h} fill={fill} rx={corner} ry={corner} />
  )
}

// Function to generate 3 months of data with actual data points
function generateThreeMonthsData(dailyViews: DailyViewData[]): DailyViewData[] {
  const result: DailyViewData[] = []
  const today = new Date()
  const threeMonthsAgo = new Date(today)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Create a map of existing data for quick lookup
  const dataMap = new Map<string, DailyViewData>()
  dailyViews.forEach((item) => {
    const dateKey = new Date(item.date).toISOString().split('T')[0]
    dataMap.set(dateKey, item)
  })

  // Generate all days for 3 months
  const currentDate = new Date(threeMonthsAgo)
  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0]
    const existingData = dataMap.get(dateKey)

    result.push({
      date: dateKey,
      views: existingData?.views || 0,
      visits: existingData?.visits || 0,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

export function ChartBarInteractive() {
  const params = useParams()
  const formId = params.formId as string

  const [analyticsData, setAnalyticsData] =
    React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!formId) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/forms/${formId}/detailed`)

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const data = await response.json()
        if (data.success) {
          setAnalyticsData(data)
        } else {
          throw new Error(data.error || 'Failed to fetch analytics')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [formId])

  const chartData = React.useMemo(() => {
    if (!analyticsData?.dailyViews) return []
    return generateThreeMonthsData(analyticsData.dailyViews)
  }, [analyticsData])

  // Ensure hover works across the category by adding a transparent hit area
  const maxY = React.useMemo(() => {
    if (!chartData.length) return 1
    return Math.max(1, ...chartData.map((d) => Math.max(d.views, d.visits)))
  }, [chartData])

  const interactiveData = React.useMemo(
    () => chartData.map((d) => ({ ...d, _hit: maxY })),
    [chartData, maxY]
  )

  const total = React.useMemo(() => {
    if (!analyticsData?.dailyViews) return { views: 0, visits: 0 }

    // Calculate totals from dailyViews data
    const totals = analyticsData.dailyViews.reduce(
      (acc, day) => ({
        views: acc.views + day.views,
        visits: acc.visits + day.visits,
      }),
      { views: 0, visits: 0 }
    )

    return totals
  }, [analyticsData])

  if (loading) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle>Form Analytics</CardTitle>
            <CardDescription>Loading analytics data...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-pulse text-muted-foreground">
              Loading chart...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle>Form Analytics</CardTitle>
            <CardDescription>Error loading analytics data</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Form Analytics</CardTitle>
          <CardDescription>
            Daily views and visits for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {['views', 'visits'].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <div
                key={chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={interactiveData}
            margin={{
              left: 0,
              right: 12,
            }}
            className="p-0"
            barCategoryGap="0%"
            barGap={-12}
          >
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
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
            />
            {/* <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                />
              }
            /> */}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  // hideLabel
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                  formatter={(value, name) => {
                    // Ignore synthetic hover series
                    if (!(name in chartConfig)) return null
                    return (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                          style={
                            {
                              '--color-bg': `var(--color-${name})`,
                            } as React.CSSProperties
                          }
                        />
                        {chartConfig[name as keyof typeof chartConfig]?.label ||
                          name}
                        <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                          {typeof value === 'number'
                            ? value.toLocaleString()
                            : value}
                        </div>
                      </>
                    )
                  }}
                />
              }
              defaultIndex={1}
            />
            {/* Transparent bar to capture hover across the whole category */}
            <Bar dataKey="_hit" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="visits" fill="var(--color-visits)" barSize={12} radius={[2, 2, 0, 0]} shape={<OverlayBar />} />
            <Bar dataKey="views" fill="var(--color-views)" barSize={12} radius={[2, 2, 0, 0]} shape={<OverlayBar />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
