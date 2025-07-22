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
    const logs = await analyticsPrisma.$queryRaw`
      SELECT "event_id", "session_id", "visit_id", "created_at", "url_path", "event_type"
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      ORDER BY "created_at" DESC
    `

    return NextResponse.json(
      { success: true, analytics: logs },
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
