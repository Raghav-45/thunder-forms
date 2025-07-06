import { FormValidator } from '@/lib/validators/form'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

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
    // Validate the request body
    const {
      title,
      description,
      fields,
      maxSubmissions,
      expiresAt,
      redirectUrl,
    } = FormValidator.parse(body)

    // Create the form in the database
    const form = await prisma.forms.create({
      data: {
        userId: session.user.id,

        // Request body
        title: title,
        description: description,
        fields: fields!,
        maxSubmissions: maxSubmissions,
        expiresAt: expiresAt,
        redirectUrl: redirectUrl,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
        },
        { status: 422 }
      )
    }

    // Unknown errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    )
  } finally {
    // No need to disconnect when using shared Prisma instance
    // The singleton handles connection management
  }
}
