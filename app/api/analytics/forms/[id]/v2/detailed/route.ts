import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const analyticsPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ANALYTICS_DATABASE_URL,
    },
  },
})

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

// Helper function to format breakdown data for radial charts
function formatBreakdownData(
  data: Array<{ [key: string]: string | bigint }>,
  labelKey: string
) {
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

    // 1. Get basic analytics logs
    const rawLogs = await analyticsPrisma.$queryRaw<LogData[]>`
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
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND "created_at" >= ${startDate}
      AND "created_at" <= NOW()
      ORDER BY "created_at" ASC
    `

    const processedAnalytics = calculateFormAnalytics(rawLogs)

    // 2. Get daily views
    const dailyViews = await analyticsPrisma.$queryRaw<
      Array<{ date: string; views: bigint; visitors: bigint }>
    >`
      SELECT 
        DATE(w."created_at") as date,
        COUNT(*) as views,
        COUNT(DISTINCT s."session_id") as visitors
      FROM "website_event" w
      LEFT JOIN "session" s ON w."session_id" = s."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      GROUP BY DATE(w."created_at")
      ORDER BY DATE(w."created_at") ASC
    `

    // 3. Get top pages
    const topPages = await analyticsPrisma.$queryRaw<
      Array<{ url_path: string; views: bigint }>
    >`
      SELECT 
        "url_path",
        COUNT(*) as views
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND "created_at" >= ${startDate}
      AND "created_at" <= NOW()
      GROUP BY "url_path"
      ORDER BY views DESC
      LIMIT 10
    `

    // 4. Get top referrers
    const topReferrers = await analyticsPrisma.$queryRaw<
      Array<{ referrer_domain: string; visits: bigint }>
    >`
      SELECT 
        COALESCE("referrer_domain", 'Direct') as referrer_domain,
        COUNT(DISTINCT "visit_id") as visits
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND "created_at" >= ${startDate}
      AND "created_at" <= NOW()
      GROUP BY "referrer_domain"
      ORDER BY visits DESC
      LIMIT 10
    `

    // 5. Get browser breakdown
    const browserBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ browser: string; count: bigint }>
    >`
      SELECT 
        s."browser",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."browser" IS NOT NULL AND s."browser" != ''
      GROUP BY s."browser"
      ORDER BY count DESC
      LIMIT 8
    `

    // 6. Get OS breakdown
    const osBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ os: string; count: bigint }>
    >`
      SELECT 
        s."os",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."os" IS NOT NULL AND s."os" != ''
      GROUP BY s."os"
      ORDER BY count DESC
      LIMIT 8
    `

    // 7. Get device breakdown
    const deviceBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ device: string; count: bigint }>
    >`
      SELECT 
        s."device",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."device" IS NOT NULL AND s."device" != ''
      GROUP BY s."device"
      ORDER BY count DESC
      LIMIT 8
    `

    // 8. Get country breakdown
    const countryBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ country: string; count: bigint }>
    >`
      SELECT 
        s."country",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."country" IS NOT NULL AND s."country" != ''
      GROUP BY s."country"
      ORDER BY count DESC
      LIMIT 6
    `

    // 9. Get state/region breakdown
    const stateBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ region: string; count: bigint }>
    >`
      SELECT 
        s."region",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."region" IS NOT NULL AND s."region" != ''
      GROUP BY s."region"
      ORDER BY count DESC
      LIMIT 6
    `

    // Format daily views data
    const formattedDailyViews = dailyViews.map(
      (day: { date: string; views: bigint; visitors: bigint }) => ({
        date: day.date,
        views: Number(day.views),
        visitors: Number(day.visitors),
      })
    )

    return NextResponse.json(
      {
        success: true,
        days,
        startDate: startDate.toISOString(),
        analytics: processedAnalytics,
        dailyViews: formattedDailyViews,
        topPages: topPages.map((page) => ({
          url_path: page.url_path,
          views: Number(page.views),
        })),
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
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: `Failed to fetch analytics for last ${days} days`,
        detail: message,
      },
      { status: 500 }
    )
  }
}

// Calculate form analytics from logs
function calculateFormAnalytics(logs: LogData[]) {
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

  const visitsMap = new Map<
    string,
    {
      events: LogData[]
      startTime: Date
      endTime: Date
    }
  >()
  const sessions = new Set<string>()

  logs.forEach((log) => {
    const visitId = log.visit_id
    const sessionId = log.session_id

    sessions.add(sessionId)

    if (!visitsMap.has(visitId)) {
      visitsMap.set(visitId, {
        events: [],
        startTime: new Date(log.created_at),
        endTime: new Date(log.created_at),
      })
    }

    const visit = visitsMap.get(visitId)!
    visit.events.push(log)
    const currentEventTime = new Date(log.created_at)
    if (currentEventTime < visit.startTime) {
      visit.startTime = currentEventTime
    }
    if (currentEventTime > visit.endTime) {
      visit.endTime = currentEventTime
    }
  })

  const visits = visitsMap.size
  const visitors = sessions.size

  let bounces = 0
  let totalTimeSeconds = 0

  visitsMap.forEach((visit) => {
    const durationMs = visit.endTime.getTime() - visit.startTime.getTime()
    const durationSeconds = Math.floor(durationMs / 1000)

    if (visit.events.length === 1) {
      bounces++
    }

    totalTimeSeconds += durationSeconds
  })

  const bounceRate = visits > 0 ? Math.round((bounces / visits) * 100) : 0
  const averageVisitDuration =
    visits > 0 ? Math.floor(totalTimeSeconds / visits) : 0

  return {
    views: views,
    visits: visits,
    visitors: visitors,
    bounces: bounces,
    totalTime: totalTimeSeconds,
    bounceRate: bounceRate,
    visitDuration: averageVisitDuration,
  }
}
