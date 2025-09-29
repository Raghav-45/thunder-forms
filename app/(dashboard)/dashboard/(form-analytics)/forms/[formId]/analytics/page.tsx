'use client'

// TODO: Refactor this file & its Imported components to use a common data fetching hook

import LoadingScreen from '@/components/LoadingScreen'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BrowserRadialChart,
  DeviceRadialChart,
  OSRadialChart,
  ReferrerGraph,
} from './breakdown-charts'
import ImpressionsChart from './impressions-chart'

// Define your data types
interface DailyViewData {
  date: string
  views: number
  visitors: number
}

interface BreakdownDataItem {
  name: string
  value: number
  country_code?: string
}

interface ReferrerDataItem {
  referrer_domain: string
  visits: number
}

interface BreakdownData {
  browser: BreakdownDataItem[]
  os: BreakdownDataItem[]
  device: BreakdownDataItem[]
  country: BreakdownDataItem[]
  state: BreakdownDataItem[]
}

interface FormAnalyticsData {
  dailyViews: DailyViewData[]
  breakdown: BreakdownData
  topReferrers: ReferrerDataItem[]
}

// Error component
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="text-red-500 mb-2">⚠️</div>
      <p className="text-sm text-red-600">{error}</p>
    </div>
  )
}

export default function FormAnalyticsPage() {
  const { formId } = useParams()
  const [analyticsData, setAnalyticsData] = useState<FormAnalyticsData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFormAnalytics = async () => {
      if (!formId) return

      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/analytics/forms/${formId}/v2/detailed?days=90`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch form analytics')
        }

        const data = await response.json()

        if (data.success) {
          setAnalyticsData({
            dailyViews: data.dailyViews || [],
            breakdown: data.breakdown || {
              browser: [],
              os: [],
              device: [],
              country: [],
              state: [],
            },
            topReferrers: data.topReferrers || [],
          })
        } else {
          throw new Error(
            data.detail || data.error || 'Failed to fetch analytics'
          )
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormAnalytics()
  }, [formId])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  if (!analyticsData) {
    return <ErrorScreen error="No analytics data available" />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <ImpressionsChart
              data={{ dailyViews: analyticsData.dailyViews }}
              loading={isLoading}
            />
          </div>

          {/* Visitor Analytics Section */}
          <div className="px-4 lg:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Visitor Analytics
            </h2>

            {/* First row - 3 equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <BrowserRadialChart data={analyticsData.breakdown} />
              <OSRadialChart data={analyticsData.breakdown} />
              <DeviceRadialChart data={analyticsData.breakdown} />
            </div>

            {/* Second row - Referrer chart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <Card className="aspect-[5/2]">
                  <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>More breakdowns</CardDescription>
                  </CardHeader>
                  <CardContent className="h-full w-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center py-8">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Coming Soon</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Bell className="h-3.5 w-3.5" />
                        <span>
                          You&apos;ll be notified when this feature is available
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 leading-none font-medium text-muted-foreground">
                      Feature in development
                    </div>
                    <div className="text-muted-foreground leading-none">
                      Track more
                    </div>
                  </CardFooter>
                </Card>
              </div>
              <div className="md:col-span-2">
                <ReferrerGraph data={analyticsData.topReferrers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
