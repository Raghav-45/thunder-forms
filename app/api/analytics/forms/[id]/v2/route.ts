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
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
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
    // For days=7, go back 6 days to include today for a total of 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0) // Start of that day

    const logs = await analyticsPrisma.$queryRaw`
      SELECT "event_id", "session_id", "visit_id", "created_at", "url_path", "event_type"
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND "created_at" >= ${startDate}
      AND "created_at" <= NOW()
      ORDER BY "created_at" DESC
    `

    return NextResponse.json(
      {
        success: true,
        analytics: logs,
        days,
        startDate: startDate.toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Analytics fetch error for last ${days} days:`, error)
    return NextResponse.json(
      { error: `Failed to fetch analytics for last ${days} days` },
      { status: 500 }
    )
  }
}
