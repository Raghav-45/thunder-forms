'use client'

// TODO: Refactor this file

import { TrendingUp } from 'lucide-react'
import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface BreakdownDataItem {
  name: string
  value: number
  country_code?: string
}

interface BreakdownData {
  browser: BreakdownDataItem[]
  os: BreakdownDataItem[]
  device: BreakdownDataItem[]
  country: BreakdownDataItem[]
  state: BreakdownDataItem[]
}

interface ReferrerDataItem {
  referrer_domain: string
  visits: number
}

interface BreakdownChartsProps {
  data?: BreakdownData
}

interface ReferrerChartsProps {
  data?: ReferrerDataItem[]
}

const chartConfig = {
  value: {
    label: 'Visitors',
  },
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      i + 1,
      {
        label: `Item ${i + 1}`,
        color: `var(--chart-${i + 1})`,
      },
    ])
  ),
} satisfies ChartConfig

// Function to assign colors to data items
const assignColors = (
  data: BreakdownDataItem[]
): Array<BreakdownDataItem & { fill: string }> => {
  return data.map((item, index) => ({
    ...item,
    fill: `var(--chart-${(index % 8) + 1})`,
  }))
}

// Function to assign colors to referrer data items
const assignColorsToReferrers = (
  data: ReferrerDataItem[]
): Array<{ name: string; value: number; fill: string }> => {
  return data.map((item, index) => ({
    name: item.referrer_domain,
    value: item.visits,
    fill: `var(--chart-${(index % 8) + 1})`,
  }))
}

// Simplified radial chart component
const RadialChart: React.FC<{
  title: string
  description: string
  data: BreakdownDataItem[]
}> = ({ title, description, data }) => {
  const chartData = React.useMemo(() => assignColors(data), [data])
  const totalVisitors = React.useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={380}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <RadialBar dataKey="value" background>
              <LabelList
                position="insideStart"
                dataKey="name"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 font-medium">
          {totalVisitors} total visitors <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function BrowserRadialChart({ data }: BreakdownChartsProps) {
  return (
    <RadialChart
      title="Browser Analytics"
      description="Visitor breakdown by browser"
      data={data?.browser || []}
    />
  )
}

export function OSRadialChart({ data }: BreakdownChartsProps) {
  return (
    <RadialChart
      title="Operating System"
      description="Visitor breakdown by OS"
      data={data?.os || []}
    />
  )
}

export function DeviceRadialChart({ data }: BreakdownChartsProps) {
  return (
    <RadialChart
      title="Device Analytics"
      description="Visitor breakdown by device"
      data={data?.device || []}
    />
  )
}

export function ReferrerRadialChart({ data }: ReferrerChartsProps) {
  const chartData = React.useMemo(() => {
    const realData = assignColorsToReferrers(data || [])

    // Add pseudo elements to ensure minimum 7 items for proper sizing
    const minItems = 7
    const pseudoItemsNeeded = Math.max(0, minItems - realData.length)

    const pseudoData = Array.from({ length: pseudoItemsNeeded }, () => ({
      name: '',
      value: 0,
      fill: 'transparent',
    }))

    return [...realData, ...pseudoData]
  }, [data])

  const totalVisits = React.useMemo(
    () =>
      chartData
        .filter((item) => item.value > 0)
        .reduce((sum, item) => sum + item.value, 0),
    [chartData]
  )

  const referrerChartConfig = {
    value: {
      label: 'Visits',
      color: 'var(--chart-2)',
    },
    label: {
      color: 'var(--background)',
    },
  } satisfies ChartConfig

  return (
    <Card className="aspect-[5/2]">
      <CardHeader>
        <CardTitle>Referrer Sources</CardTitle>
        <CardDescription>Traffic sources breakdown</CardDescription>
      </CardHeader>
      <CardContent className="h-full w-full">
        <ChartContainer className="h-full w-full" config={referrerChartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 8,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="value"
              layout="vertical"
              fill="var(--color-value)"
              radius={4}
            >
              <LabelList
                dataKey="name"
                position="insideLeft"
                offset={8}
                className="fill-[var(--foreground)] font-medium"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => (value > 0 ? value : '')}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {totalVisits} total visits <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing traffic sources for the selected period
        </div>
      </CardFooter>
    </Card>
  )
}
