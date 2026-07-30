import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch forms for the authenticated user only
    const forms = await prisma.forms.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        expiresAt: true,
        maxSubmissions: true,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    return NextResponse.json(forms)
  } catch (error) {
    console.error('API Error:', error)

    // Handle different types of errors
    if (error instanceof Error) {
      // Prisma or other known errors
      return NextResponse.json(
        {
          error: 'Database error occurred',
          message:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      )
    }

    // Unknown errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // No need to disconnect when using shared Prisma instance
    // The singleton handles connection management
  }
}
