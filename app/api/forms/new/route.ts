import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
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

    // Parse the request body
    const body = await request.json()

    // Create the form in the database
    const form = await prisma.forms.create({
      data: {
        userId: session.user.id,
        title: body.formName,
        description: body.formDescription || '',
        fields: body.formFields,
        maxSubmissions: body.maxSubmissions || null,
        expiresAt: body.expiresAt || null,
        redirectUrl: body.redirectUrl || null,
      },
    })

    // Return success response with the created form
    return NextResponse.json(
      {
        success: true,
        id: form.id,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error('Error creating form:', error)

    // Handle different types of errors
    if (error instanceof Error) {
      // Prisma or other known errors
      return NextResponse.json(
        {
          success: false,
          error: 'Database error occurred',
          message:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      )
    }

    // Unknown errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  } finally {
    // No need to disconnect when using shared Prisma instance
    // The singleton handles connection management
  }
}
