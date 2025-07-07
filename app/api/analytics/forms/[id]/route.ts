import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const analyticsPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ANALYTICS_DATABASE_URL,
    },
  },
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    const logs = await analyticsPrisma.$queryRaw`
      SELECT "url_path", "created_at"
      FROM "website_event"
      WHERE "url_path" ILIKE '%' || ${id} || '%'
        AND "url_path" NOT ILIKE '/dashboard/builder/%'
      ORDER BY "created_at" DESC
    `

    return NextResponse.json({ success: true, data: logs }, { status: 200 })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
