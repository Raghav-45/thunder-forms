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
    // Calculate the date 30 days ago (inclusive of today)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29) // Go back 29 days to include today for a total of 30
    thirtyDaysAgo.setHours(0, 0, 0, 0) // Start of that day

    const logs = await analyticsPrisma.$queryRaw`
      SELECT "url_path", "created_at"
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND "created_at" >= ${thirtyDaysAgo}
      AND "created_at" <= NOW()
      ORDER BY "created_at" DESC
    `

    return NextResponse.json(
      { success: true, analytics: logs },
      { status: 200 }
    )
  } catch (error) {
    console.error('Analytics fetch error for last 30 days:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics for last 30 days' },
      { status: 500 }
    )
  }
}
