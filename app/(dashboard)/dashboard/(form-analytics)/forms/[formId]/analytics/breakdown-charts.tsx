'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TrendingUp } from 'lucide-react'
import { useParams } from 'next/navigation'
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

interface BreakdownData {
  name: string
  value: number
  fill: string
  country_code?: string
}

interface AnalyticsResponse {
  success: boolean
  browser: BreakdownData[]
  os: BreakdownData[]
  device: BreakdownData[]
  country: BreakdownData[]
  state: BreakdownData[]
}

const fetchBreakdownAnalytics = async (
  formId: string
): Promise<AnalyticsResponse> => {
  const response = await axios.get(`/api/analytics/forms/${formId}/breakdown`)
  return response.data
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

// Simplified loading component
const ChartLoading: React.FC<{ title: string }> = ({ title }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>Loading...</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    </CardContent>
  </Card>
)

// Simplified error component
const ChartError: React.FC<{ title: string; message: string }> = ({
  title,
  message,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>Error loading data</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        {message}
      </div>
    </CardContent>
  </Card>
)

// Simplified radial chart component
const RadialChart: React.FC<{
  title: string
  description: string
  data: BreakdownData[]
  isLoading: boolean
  error: unknown
  errorMessage: string
}> = ({ title, description, data, isLoading, error, errorMessage }) => {
  if (isLoading) {
    return <ChartLoading title={title} />
  }

  if (error) {
    return <ChartError title={title} message={errorMessage} />
  }

  const totalVisitors = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <RadialBarChart
            data={data}
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

// Hook for fetching analytics data
const useAnalyticsData = () => {
  const params = useParams()
  const formId = params?.formId as string

  return useQuery({
    queryKey: ['breakdown-analytics', formId],
    queryFn: () => fetchBreakdownAnalytics(formId),
    enabled: !!formId,
  })
}

export function BrowserRadialChart() {
  const { data, isLoading, error } = useAnalyticsData()

  return (
    <RadialChart
      title="Browser Analytics"
      description="Visitor breakdown by browser"
      data={data?.browser || []}
      isLoading={isLoading}
      error={error || !data?.success}
      errorMessage="Failed to load browser data"
    />
  )
}

export function OSRadialChart() {
  const { data, isLoading, error } = useAnalyticsData()

  return (
    <RadialChart
      title="Operating System"
      description="Visitor breakdown by OS"
      data={data?.os || []}
      isLoading={isLoading}
      error={error || !data?.success}
      errorMessage="Failed to load OS data"
    />
  )
}

export function DeviceRadialChart() {
  const { data, isLoading, error } = useAnalyticsData()

  return (
    <RadialChart
      title="Device Analytics"
      description="Visitor breakdown by device"
      data={data?.device || []}
      isLoading={isLoading}
      error={error || !data?.success}
      errorMessage="Failed to load device data"
    />
  )
}
