import { analyticsPrisma, prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await prisma.forms.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }
  if (form.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!process.env.ANALYTICS_DATABASE_URL) {
    return NextResponse.json(
      { error: 'Analytics DB not configured' },
      { status: 500 }
    )
  }

  try {
    const logs = await analyticsPrisma.$queryRaw`
      SELECT "event_id", "session_id", "visit_id", "created_at", "url_path", "event_type"
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
