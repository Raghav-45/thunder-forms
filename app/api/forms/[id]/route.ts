import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const id = params.id

    // Fetch form with user authorization check
    const form = await prisma.forms.findUnique({
      where: {
        id,
        userId: session.user.id, // Ensure user can only access their own forms
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'Form has expired',
        },
        { status: 410 }
      )
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('Get form error:', error)

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
