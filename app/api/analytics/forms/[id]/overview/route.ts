// pages/api/analytics/[id]/index.ts (Modified)
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const analyticsPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ANALYTICS_DATABASE_URL,
    },
  },
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    // 1. Fetch raw logs
    // NOTE: If you need more fields for future calculations (e.g., user agent for unique users
    // based on IP/UA, ensure those are selected here. For now, session_id and visit_id are enough)
    const rawLogs: Array<any> = await analyticsPrisma.$queryRaw`
      SELECT
        "event_id",
        "session_id",
        "visit_id",
        "created_at",
        "url_path",
        "event_type"
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      ORDER BY "created_at" ASC -- Order by created_at for duration calculation
    `

    // 2. Process the raw logs to derive metrics
    const processedAnalytics = calculateFormAnalytics(rawLogs);

    return NextResponse.json(
      { success: true, analytics: processedAnalytics }, // Send the processed metrics
      { status: 200 }
    )
  } catch (error) {
    console.error('Analytics fetch error for all time:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics for all time' },
      { status: 500 }
    )
  }
}


// --- Analytics Calculation Function ---
function calculateFormAnalytics(logs: Array<any>) {
  // If no logs, return zeros
  if (!logs || logs.length === 0) {
    return {
      views: 0,
      visits: 0,
      visitors: 0,
      bounceRate: 0,
      visitDuration: 0,
      rawLogs: [] // Optional: Include raw logs if needed for debugging or display
    };
  }

  const views = logs.length; // Total events/page views

  // Group events by visit_id and session_id
  const visitsMap = new Map<string, {
    events: any[],
    startTime: Date,
    endTime: Date
  }>();
  const sessions = new Set<string>(); // To count unique visitors

  logs.forEach(log => {
    const visitId = log.visit_id;
    const sessionId = log.session_id;

    sessions.add(sessionId); // Add session to count unique visitors

    if (!visitsMap.has(visitId)) {
      visitsMap.set(visitId, {
        events: [],
        startTime: new Date(log.created_at),
        endTime: new Date(log.created_at)
      });
    }

    const visit = visitsMap.get(visitId)!;
    visit.events.push(log);
    // Update start/end times for duration calculation
    const currentEventTime = new Date(log.created_at);
    if (currentEventTime < visit.startTime) {
      visit.startTime = currentEventTime;
    }
    if (currentEventTime > visit.endTime) {
      visit.endTime = currentEventTime;
    }
  });

  const visits = visitsMap.size; // Total unique visits
  const visitors = sessions.size; // Total unique sessions (visitors)

  let singlePageVisits = 0;
  let totalDurationSeconds = 0;
  let visitsWithDuration = 0; // To correctly average durations

  visitsMap.forEach(visit => {
    if (visit.events.length === 1) {
      singlePageVisits++;
    }

    // Calculate duration for this visit
    const durationMs = visit.endTime.getTime() - visit.startTime.getTime();
    if (durationMs > 0) { // Only count visits with actual duration (more than 1 event or non-zero time)
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
    bounceRate: parseFloat(bounceRate.toFixed(1)), // Round to one decimal place
    visitDuration: parseFloat(averageVisitDuration.toFixed(1)), // Round to one decimal place
    // You might want to remove rawLogs from the final output if not needed on the client
    // rawLogs: logs
  };
}