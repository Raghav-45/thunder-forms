// pages/api/analytics/[id]/today.ts
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
      SELECT "url_path", "created_at"
      FROM "website_event"
      WHERE "url_path" ILIKE ${`/forms/${id}%`}
      AND DATE_TRUNC('day', "created_at") = CURRENT_DATE
      ORDER BY "created_at" DESC
    `

    return NextResponse.json(
      { success: true, analytics: logs },
      { status: 200 }
    )
  } catch (error) {
    console.error('Analytics fetch error for today:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics for today' },
      { status: 500 }
    )
  }
}
