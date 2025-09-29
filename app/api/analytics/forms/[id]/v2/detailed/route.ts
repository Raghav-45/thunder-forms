import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { analyticsPrisma: PrismaClient }

const analyticsPrisma =
  globalForPrisma.analyticsPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.ANALYTICS_DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.analyticsPrisma = analyticsPrisma

interface LogData {
  event_id: string
  session_id: string
  visit_id: string
  created_at: Date
  url_path: string
  event_type: number
  referrer_domain?: string
  page_title?: string
}

interface BreakdownItem {
  [key: string]: string | bigint
  count: bigint
}

interface DailyViewResult {
  date: string
  views: bigint
  visitors: bigint
}

interface ReferrerResult {
  referrer_domain: string
  visits: bigint
}

interface AnalyticsResult {
  views: number
  visits: number
  visitors: number
  bounces: number
  totalTime: number
  bounceRate: number
  visitDuration: number
}

// Helper function to format breakdown data for radial charts
function formatBreakdownData(
  data: BreakdownItem[],
  labelKey: string
): Array<{ name: string; value: number; country_code?: string }> {
  return data.map((item) => {
    const base = {
      name: item[labelKey] as string,
      value: Number(item.count),
    }
    // For country data, use the country field as country_code since it contains ISO codes
    if (labelKey === 'country') {
      return { ...base, country_code: item[labelKey] as string }
    }
    return base
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  if (!process.env.ANALYTICS_DATABASE_URL) {
    console.error('ANALYTICS_DATABASE_URL is not set')
    return NextResponse.json(
      { error: 'Analytics DB not configured' },
      { status: 500 }
    )
  }

  // Parse days parameter, default to 90 if not provided
  let days = 90
  if (daysParam) {
    const parsed = parseInt(daysParam, 10)
    if (isNaN(parsed) || parsed < 1) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be a positive integer.' },
        { status: 400 }
      )
    }
    days = parsed
  }

  try {
    // Calculate the start date
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    const urlPattern = `/forms/${id}%`

    // Execute all queries in parallel for maximum performance
    const [
      rawLogs,
      dailyViews,
      topReferrers,
      browserBreakdown,
      osBreakdown,
      deviceBreakdown,
      countryBreakdown,
      stateBreakdown,
    ] = await Promise.all([
      // 1. Get basic analytics logs
      analyticsPrisma.$queryRaw<LogData[]>`
        SELECT
          "event_id",
          "session_id",
          "visit_id",
          "created_at",
          "url_path",
          "event_type",
          "referrer_domain",
          "page_title"
        FROM "website_event"
        WHERE "url_path" ILIKE ${urlPattern}
        AND "created_at" >= ${startDate}
        AND "created_at" <= NOW()
        ORDER BY "created_at" ASC
      `,

      // 2. Get daily views
      analyticsPrisma.$queryRaw<DailyViewResult[]>`
        SELECT 
          DATE(w."created_at") as date,
          COUNT(*) as views,
          COUNT(DISTINCT s."session_id") as visitors
        FROM "website_event" w
        LEFT JOIN "session" s ON w."session_id" = s."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        GROUP BY DATE(w."created_at")
        ORDER BY DATE(w."created_at") ASC
      `,

      // 3. Get top referrers
      analyticsPrisma.$queryRaw<ReferrerResult[]>`
        SELECT 
          COALESCE("referrer_domain", 'Direct') as referrer_domain,
          COUNT(DISTINCT "visit_id") as visits
        FROM "website_event"
        WHERE "url_path" ILIKE ${urlPattern}
        AND "created_at" >= ${startDate}
        AND "created_at" <= NOW()
        GROUP BY "referrer_domain"
        ORDER BY visits DESC
        LIMIT 10
      `,

      // 4. Get browser breakdown
      analyticsPrisma.$queryRaw<BreakdownItem[]>`
        SELECT 
          s."browser",
          COUNT(DISTINCT s."session_id") as count
        FROM "session" s
        INNER JOIN "website_event" w ON s."session_id" = w."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        AND s."browser" IS NOT NULL AND s."browser" != ''
        GROUP BY s."browser"
        ORDER BY count DESC
        LIMIT 8
      `,

      // 5. Get OS breakdown
      analyticsPrisma.$queryRaw<BreakdownItem[]>`
        SELECT 
          s."os",
          COUNT(DISTINCT s."session_id") as count
        FROM "session" s
        INNER JOIN "website_event" w ON s."session_id" = w."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        AND s."os" IS NOT NULL AND s."os" != ''
        GROUP BY s."os"
        ORDER BY count DESC
        LIMIT 8
      `,

      // 6. Get device breakdown
      analyticsPrisma.$queryRaw<BreakdownItem[]>`
        SELECT 
          s."device",
          COUNT(DISTINCT s."session_id") as count
        FROM "session" s
        INNER JOIN "website_event" w ON s."session_id" = w."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        AND s."device" IS NOT NULL AND s."device" != ''
        GROUP BY s."device"
        ORDER BY count DESC
        LIMIT 8
      `,

      // 7. Get country breakdown
      analyticsPrisma.$queryRaw<BreakdownItem[]>`
        SELECT 
          s."country",
          COUNT(DISTINCT s."session_id") as count
        FROM "session" s
        INNER JOIN "website_event" w ON s."session_id" = w."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        AND s."country" IS NOT NULL AND s."country" != ''
        GROUP BY s."country"
        ORDER BY count DESC
        LIMIT 6
      `,

      // 8. Get state/region breakdown
      analyticsPrisma.$queryRaw<BreakdownItem[]>`
        SELECT 
          s."region",
          COUNT(DISTINCT s."session_id") as count
        FROM "session" s
        INNER JOIN "website_event" w ON s."session_id" = w."session_id"
        WHERE w."url_path" ILIKE ${urlPattern}
        AND w."created_at" >= ${startDate}
        AND w."created_at" <= NOW()
        AND s."region" IS NOT NULL AND s."region" != ''
        GROUP BY s."region"
        ORDER BY count DESC
        LIMIT 6
      `,
    ])

    // Process analytics with optimized single-pass algorithm
    const processedAnalytics = calculateFormAnalytics(rawLogs)

    // Format daily views data
    const formattedDailyViews = dailyViews.map((day) => ({
      date: day.date,
      views: Number(day.views),
      visitors: Number(day.visitors),
    }))

    return NextResponse.json(
      {
        success: true,
        days,
        startDate: startDate.toISOString(),
        analytics: processedAnalytics,
        dailyViews: formattedDailyViews,
        topReferrers: topReferrers.map((ref) => ({
          referrer_domain: ref.referrer_domain,
          visits: Number(ref.visits),
        })),
        breakdown: {
          browser: formatBreakdownData(browserBreakdown, 'browser'),
          os: formatBreakdownData(osBreakdown, 'os'),
          device: formatBreakdownData(deviceBreakdown, 'device'),
          country: formatBreakdownData(countryBreakdown, 'country'),
          state: formatBreakdownData(stateBreakdown, 'region'),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Analytics fetch error for last ${days} days:`, error)

    // Improved error handling with specific cases
    if (error instanceof Error) {
      // Check for common Prisma errors
      if (error.message.includes('connect')) {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            detail: 'Unable to connect to analytics database',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          error: `Failed to fetch analytics for last ${days} days`,
          detail: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: `Failed to fetch analytics for last ${days} days`,
        detail: String(error),
      },
      { status: 500 }
    )
  }
}

// Optimized single-pass analytics calculation
function calculateFormAnalytics(logs: LogData[]): AnalyticsResult {
  if (!logs || logs.length === 0) {
    return {
      views: 0,
      visits: 0,
      visitors: 0,
      bounces: 0,
      totalTime: 0,
      bounceRate: 0,
      visitDuration: 0,
    }
  }

  const views = logs.length
  const sessions = new Set<string>()
  const visitsMap = new Map<
    string,
    {
      eventCount: number
      startTime: number
      endTime: number
    }
  >()

  // Single-pass calculation for maximum efficiency
  for (const log of logs) {
    sessions.add(log.session_id)

    const visitId = log.visit_id
    const eventTime = new Date(log.created_at).getTime()

    const visit = visitsMap.get(visitId)
    if (!visit) {
      visitsMap.set(visitId, {
        eventCount: 1,
        startTime: eventTime,
        endTime: eventTime,
      })
    } else {
      visit.eventCount++
      if (eventTime < visit.startTime) {
        visit.startTime = eventTime
      }
      if (eventTime > visit.endTime) {
        visit.endTime = eventTime
      }
    }
  }

  const visits = visitsMap.size
  const visitors = sessions.size
  let bounces = 0
  let totalTimeSeconds = 0

  // Calculate bounces and total time
  for (const visit of visitsMap.values()) {
    if (visit.eventCount === 1) {
      bounces++
    }
    const durationSeconds = Math.floor((visit.endTime - visit.startTime) / 1000)
    totalTimeSeconds += durationSeconds
  }

  const bounceRate = visits > 0 ? Math.round((bounces / visits) * 100) : 0
  const averageVisitDuration =
    visits > 0 ? Math.floor(totalTimeSeconds / visits) : 0

  return {
    views,
    visits,
    visitors,
    bounces,
    totalTime: totalTimeSeconds,
    bounceRate,
    visitDuration: averageVisitDuration,
  }
}
