import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Fetch form with its responses
    const formWithResponses = await prisma.forms.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: {
            createdAt: 'desc', // Get newest responses first
          },
        },
      },
    })

    if (!formWithResponses) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (formWithResponses.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      formId: formWithResponses.id,
      title: formWithResponses.title,
      responses: formWithResponses.responses,
    })
  } catch (error) {
    console.error('Get form responses error:', error)

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
