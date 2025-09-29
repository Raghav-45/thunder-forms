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

// interface SessionData {
//   session_id: string
//   browser: string
//   os: string
//   device: string
//   screen: string
//   language: string
//   country: string
//   region: string
//   city: string
//   created_at: Date
// }

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
    return NextResponse.json({ error: 'Analytics DB not configured' }, { status: 500 })
  }

  // Parse days parameter, default to 7 if not provided
  let days = 7
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

    // 2. Get session data with device/browser/location info
    // const sessions = await analyticsPrisma.$queryRaw<SessionData[]>`
    //   SELECT DISTINCT 
    //     s."session_id",
    //     s."browser",
    //     s."os",
    //     s."device",
    //     s."screen",
    //     s."language",
    //     s."country",
    //     s."region",
    //     s."city",
    //     s."created_at"
    //   FROM "session" s
    //   INNER JOIN "website_event" w ON s."session_id" = w."session_id"
    //   WHERE w."url_path" ILIKE ${`/forms/${id}%`}
    //   AND w."created_at" >= ${startDate}
    //   AND w."created_at" <= NOW()
    //   ORDER BY s."created_at" DESC
    //   LIMIT 50
    // `

    // 3. Get daily views
    const dailyViews = await analyticsPrisma.$queryRaw<Array<{date: string, views: bigint, visitors: bigint}>>`
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

    // 4. Get top pages
    const topPages = await analyticsPrisma.$queryRaw<Array<{url_path: string, views: bigint}>>`
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

    // 5. Get top referrers
    const topReferrers = await analyticsPrisma.$queryRaw<Array<{referrer_domain: string, visits: bigint}>>`
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

    // 6. Get device breakdown
    const deviceBreakdown = await analyticsPrisma.$queryRaw<Array<{device: string, count: bigint}>>`
      SELECT 
        s."device",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."device" IS NOT NULL
      GROUP BY s."device"
      ORDER BY count DESC
    `

    // 7. Get browser breakdown
    const browserBreakdown = await analyticsPrisma.$queryRaw<Array<{browser: string, count: bigint}>>`
      SELECT 
        s."browser",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."browser" IS NOT NULL
      GROUP BY s."browser"
      ORDER BY count DESC
      LIMIT 10
    `

    // 8. Get location breakdown
    const locationBreakdown = await analyticsPrisma.$queryRaw<Array<{country: string, city: string, count: bigint}>>`
      SELECT 
        s."country",
        s."city",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND w."created_at" >= ${startDate}
      AND w."created_at" <= NOW()
      AND s."country" IS NOT NULL
      GROUP BY s."country", s."city"
      ORDER BY count DESC
      LIMIT 20
    `

    // Format daily views data
    const formattedDailyViews = dailyViews.map((day: {date: string, views: bigint, visitors: bigint}) => ({
      date: day.date,
      views: Number(day.views),
      visitors: Number(day.visitors)
    }))

    return NextResponse.json({
      success: true,
      days,
      startDate: startDate.toISOString(),
      analytics: processedAnalytics,
      // sessions: sessions,
      dailyViews: formattedDailyViews,
      topPages: topPages.map(page => ({
        url_path: page.url_path,
        views: Number(page.views)
      })),
      topReferrers: topReferrers.map(ref => ({
        referrer_domain: ref.referrer_domain,
        visits: Number(ref.visits)
      })),
      deviceBreakdown: deviceBreakdown.map(device => ({
        device: device.device,
        count: Number(device.count)
      })),
      browserBreakdown: browserBreakdown.map(browser => ({
        browser: browser.browser,
        count: Number(browser.count)
      })),
      locationBreakdown: locationBreakdown.map(location => ({
        country: location.country,
        city: location.city,
        count: Number(location.count)
      }))
    }, { status: 200 })

  } catch (error) {
    console.error(`Analytics fetch error for last ${days} days:`, error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to fetch analytics for last ${days} days`, detail: message },
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
      bounceRate: 0,
      visitDuration: 0,
    };
  }

  const views = logs.length;

  const visitsMap = new Map<string, {
    events: LogData[],
    startTime: Date,
    endTime: Date
  }>();
  const sessions = new Set<string>();

  logs.forEach(log => {
    const visitId = log.visit_id;
    const sessionId = log.session_id;

    sessions.add(sessionId);

    if (!visitsMap.has(visitId)) {
      visitsMap.set(visitId, {
        events: [],
        startTime: new Date(log.created_at),
        endTime: new Date(log.created_at)
      });
    }

    const visit = visitsMap.get(visitId)!;
    visit.events.push(log);
    const currentEventTime = new Date(log.created_at);
    if (currentEventTime < visit.startTime) {
      visit.startTime = currentEventTime;
    }
    if (currentEventTime > visit.endTime) {
      visit.endTime = currentEventTime;
    }
  });

  const visits = visitsMap.size;
  const visitors = sessions.size;

  let singlePageVisits = 0;
  let totalDurationSeconds = 0;
  let visitsWithDuration = 0;

  visitsMap.forEach(visit => {
    if (visit.events.length === 1) {
      singlePageVisits++;
    }

    const durationMs = visit.endTime.getTime() - visit.startTime.getTime();
    if (durationMs > 0) {
      totalDurationSeconds += durationMs / 1000;
      visitsWithDuration++;
    }
  });

  const bounceRate = visits > 0 ? (singlePageVisits / visits) * 100 : 0;
  const averageVisitDuration = visitsWithDuration > 0 ? totalDurationSeconds / visitsWithDuration : 0;

  return {
    views: views,
    visits: visits,
    visitors: visitors,
    bounceRate: parseFloat(bounceRate.toFixed(1)),
    visitDuration: parseFloat(averageVisitDuration.toFixed(1)),
  };
}