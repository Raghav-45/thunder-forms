'use client'

// TODO: Refactor this file

import { TrendingUp } from 'lucide-react'
import * as React from 'react'
import { LabelList, RadialBar, RadialBarChart } from 'recharts'

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

interface BreakdownChartsProps {
  data?: BreakdownData
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
const assignColors = (data: BreakdownDataItem[]): Array<BreakdownDataItem & { fill: string }> => {
  return data.map((item, index) => ({
    ...item,
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