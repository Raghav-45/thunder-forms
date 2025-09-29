'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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
} from '@/components/ui/chart'

export const description = 'Form analytics chart showing daily views and visitors'

const chartConfig = {
  views: {
    label: 'Views',
    color: 'oklch(0.488 0.243 264.376 / 0.4)',
  },
  visitors: {
    label: 'Visitors',
    color: 'oklch(0.488 0.243 264.376)',
  },
} satisfies ChartConfig

interface DailyViewData {
  date: string
  views: number
  visitors: number
}

// Custom bar shape to snap to whole pixels and reduce anti-aliasing gaps when overlapping
// Minimal typing for the custom shape to satisfy linting without pulling full Recharts types
type ShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: Record<string, unknown>
}

// Custom bar shape that draws both series starting from zero without summing
function OverlayStackShape(props: ShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  const rx = Math.round(x)
  const ry = Math.round(y)
  const w = Math.round(width)
  const h = Math.round(height)

  const visitors = Number(payload?.visitors ?? 0)
  const views = Number(payload?.views ?? 0)
  const maxVal = Math.max(1, visitors, views)

  // Scale heights relative to max of the two
  const visitorsH = Math.round((h * visitors) / maxVal)
  const viewsH = Math.round((h * views) / maxVal)
  const baseY = ry + h

  const corner = 2

  return (
    <g>
      {/* Visitors bar */}
      {visitors > 0 && (
        <rect
          x={rx}
          y={baseY - visitorsH}
          width={w}
          height={visitorsH}
          fill="var(--color-visitors)"
          rx={corner}
          ry={corner}
        />
      )}
      {/* Views bar (overlay) */}
      {views > 0 && (
        <rect
          x={rx}
          y={baseY - viewsH}
          width={w}
          height={viewsH}
          fill="var(--color-views)"
          rx={corner}
          ry={corner}
        />
      )}
    </g>
  )
}

// Custom tooltip content to mimic the original UI and show Visits and Views rows
type TooltipProps = { active?: boolean; payload?: Array<{ payload?: { date?: string; views?: number; visitors?: number } }> }
function OverlayTooltipContent(props: TooltipProps) {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const raw = payload[0]?.payload as { date?: string; views?: number; visitors?: number }
  const date = raw?.date ? new Date(raw.date) : new Date()
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const visitors = Number(raw?.visitors ?? 0)
  const views = Number(raw?.views ?? 0)

  return (
    <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl w-[150px]">
      <div className="font-medium">{dateLabel}</div>
      <div className="grid gap-1.5">
        <div className="[&>svg]:text-muted-foreground flex w-full flex-wrap gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 items-center">
          <div
            className="shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg) h-2.5 w-2.5"
            style={{ '--color-bg': 'var(--color-visitors)', '--color-border': 'var(--color-visitors)' } as React.CSSProperties}
          />
          <div className="flex flex-1 justify-between leading-none items-center">
            <div className="grid gap-1.5">
              <span className="text-muted-foreground">Visitors</span>
            </div>
            {visitors.toLocaleString()}
          </div>
        </div>
        <div className="[&>svg]:text-muted-foreground flex w-full flex-wrap gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 items-center">
          <div
            className="shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg) h-2.5 w-2.5"
            style={{ '--color-bg': 'var(--color-views)', '--color-border': 'var(--color-views)' } as React.CSSProperties}
          />
          <div className="flex flex-1 justify-between leading-none items-center">
            <div className="grid gap-1.5">
              <span className="text-muted-foreground">Views</span>
            </div>
            {views.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
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
      visitors: existingData?.visitors || 0,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

interface ImpressionsChartProps {
  data: { dailyViews: DailyViewData[] } | undefined
  loading: boolean
}

const ImpressionsChart: React.FC<ImpressionsChartProps> = ({ data, loading }) => {
  const chartData = React.useMemo(() => {
    if (!data?.dailyViews) return []
    return generateThreeMonthsData(data.dailyViews)
  }, [data])

  const interactiveData = React.useMemo(
    () => chartData.map((d) => ({ ...d, _max: Math.max(d.views, d.visitors) })),
    [chartData]
  )

  const total = React.useMemo(() => {
    if (!data?.dailyViews) return { views: 0, visitors: 0 }

    const totals = data.dailyViews.reduce(
      (acc: { views: number; visitors: number }, day: DailyViewData) => ({
        views: acc.views + day.views,
        visitors: acc.visitors + day.visitors,
      }),
      { views: 0, visitors: 0 }
    )

    return totals
  }, [data])

  if (loading) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle>Form Analytics</CardTitle>
            <CardDescription>Loading analytics data...</CardDescription>
          </div>
          <div className="flex">
          {['views', 'visitors'].map((key) => {
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
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
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
            Daily views and visitors for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {['views', 'visitors'].map((key) => {
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
              left: -24,
              right: 6,
            }}
            className="p-0"
            // Keep default grouping; custom shape draws both values
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
            <ChartTooltip content={<OverlayTooltipContent />} defaultIndex={1} />
            {/* Single custom bar draws both series without summing */}
            <Bar dataKey="_max" fill="transparent" shape={<OverlayStackShape />} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default ImpressionsChart