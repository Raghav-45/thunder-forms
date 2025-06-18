import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = await createClient()

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session retrieval errors
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch forms for the authenticated user only
    const forms = await prisma.forms.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: { userId: { equals: session.user.id } },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
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
