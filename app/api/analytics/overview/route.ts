import { analyticsPrisma, prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

interface WebsiteEventLog {
  event_id: string
  session_id: string
  visit_id: string
  created_at: Date
  url_path: string
  event_type: string
}

interface VisitData {
  events: WebsiteEventLog[]
  startTime: Date
  endTime: Date
}

interface TimeSeriesData {
  date: string
  views: number
  visits: number
  visitors: number
}

interface OverallAnalytics {
  totalViews: number
  totalVisits: number
  totalVisitors: number
  totalForms: number
  totalResponses: number
  averageBounceRate: number
  averageVisitDuration: number
  timeSeriesData: TimeSeriesData[]
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    // Get all forms for the authenticated user
    const userForms = await prisma.forms.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    if (userForms.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalViews: 0,
          totalVisits: 0,
          totalVisitors: 0,
          totalForms: 0,
          totalResponses: 0,
          averageBounceRate: 0,
          averageVisitDuration: 0,
          timeSeriesData: [],
        },
      })
    }

    // Create URL patterns for all user forms
    const formIds = userForms.map((form) => form.id)

    // Fetch analytics data for all user forms by combining conditions
    let rawLogs: WebsiteEventLog[] = []

    if (formIds.length > 0) {
      // Build dynamic where clause for multiple forms
      const whereConditions = formIds
        .map((id) => `"url_path" ILIKE '/forms/${id}%'`)
        .join(' OR ')

      rawLogs = await analyticsPrisma.$queryRawUnsafe<WebsiteEventLog[]>(`
        SELECT
          "event_id",
          "session_id",
          "visit_id",
          "created_at",
          "url_path",
          "event_type"
        FROM "website_event"
        WHERE ${whereConditions}
        ORDER BY "created_at" ASC
      `)
    }

    // Calculate overall analytics
    const analytics = calculateOverallAnalytics(rawLogs, userForms)

    return NextResponse.json({ success: true, analytics }, { status: 200 })
  } catch (error) {
    console.error('Overall analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overall analytics' },
      { status: 500 }
    )
  }
}

function calculateOverallAnalytics(
  logs: WebsiteEventLog[],
  forms: Array<{ id: string; _count: { responses: number } }>
): OverallAnalytics {
  if (!logs || logs.length === 0) {
    return {
      totalViews: 0,
      totalVisits: 0,
      totalVisitors: 0,
      totalForms: forms.length,
      totalResponses: forms.reduce(
        (sum, form) => sum + form._count.responses,
        0
      ),
      averageBounceRate: 0,
      averageVisitDuration: 0,
      timeSeriesData: [],
    }
  }

  const totalViews = logs.length
  const sessions = new Set<string>()
  const visits = new Set<string>()
  const visitsMap = new Map<string, VisitData>()
  const dailyData = new Map<
    string,
    { views: Set<string>; visits: Set<string>; visitors: Set<string> }
  >()

  // Process logs
  logs.forEach((log) => {
    sessions.add(log.session_id)
    visits.add(log.visit_id)

    // Track daily data
    const dateKey = log.created_at.toISOString().split('T')[0]
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        views: new Set(),
        visits: new Set(),
        visitors: new Set(),
      })
    }
    const dayData = dailyData.get(dateKey)!
    dayData.views.add(log.event_id)
    dayData.visits.add(log.visit_id)
    dayData.visitors.add(log.session_id)

    // Track visit data for bounce rate and duration
    if (!visitsMap.has(log.visit_id)) {
      visitsMap.set(log.visit_id, {
        events: [],
        startTime: log.created_at,
        endTime: log.created_at,
      })
    }
    const visitData = visitsMap.get(log.visit_id)!
    visitData.events.push(log)
    visitData.endTime = log.created_at
  })

  // Calculate bounce rate
  let bouncedVisits = 0
  let totalDuration = 0

  visitsMap.forEach((visitData) => {
    if (visitData.events.length === 1) {
      bouncedVisits++
    }
    const duration =
      (visitData.endTime.getTime() - visitData.startTime.getTime()) / 1000
    totalDuration += duration
  })

  const bounceRate = visits.size > 0 ? (bouncedVisits / visits.size) * 100 : 0
  const averageVisitDuration = visits.size > 0 ? totalDuration / visits.size : 0

  // Convert daily data to time series
  const timeSeriesData: TimeSeriesData[] = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      views: data.views.size,
      visits: data.visits.size,
      visitors: data.visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Fill in missing dates with zero values for the last 90 days
  const filledTimeSeriesData = fillMissingDates(timeSeriesData, 90)

  return {
    totalViews,
    totalVisits: visits.size,
    totalVisitors: sessions.size,
    totalForms: forms.length,
    totalResponses: forms.reduce((sum, form) => sum + form._count.responses, 0),
    averageBounceRate: Math.round(bounceRate * 10) / 10,
    averageVisitDuration: Math.round(averageVisitDuration),
    timeSeriesData: filledTimeSeriesData,
  }
}

/**
 * Fill in missing dates with zero values for continuous chart display
 * @param data - Existing time series data (may have gaps)
 * @param days - Number of days to generate (7, 30, or 90)
 * @returns Complete time series with all dates filled
 */
function fillMissingDates(
  data: TimeSeriesData[],
  days: number
): TimeSeriesData[] {
  if (data.length === 0) {
    // If no data at all, generate empty data for the last N days
    const result: TimeSeriesData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      result.push({
        date: date.toISOString().split('T')[0],
        views: 0,
        visits: 0,
        visitors: 0,
      })
    }
    return result
  }

  // Create a map for quick lookup
  const dataMap = new Map<string, TimeSeriesData>()
  data.forEach((item) => {
    dataMap.set(item.date, item)
  })

  // Find the date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from either the earliest data point or N days ago, whichever is more recent
  const earliestDataDate = new Date(data[0].date)
  const nDaysAgo = new Date(today)
  nDaysAgo.setDate(nDaysAgo.getDate() - (days - 1))

  const startDate = earliestDataDate < nDaysAgo ? nDaysAgo : earliestDataDate

  // Generate all dates from start to today
  const result: TimeSeriesData[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0]

    if (dataMap.has(dateKey)) {
      result.push(dataMap.get(dateKey)!)
    } else {
      result.push({
        date: dateKey,
        views: 0,
        visits: 0,
        visitors: 0,
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}
