import { FormValidator } from '@/lib/validators/form'
import { auth } from '@/lib/auth'
import { isFormStructure } from '@/features/form-builder/form-structure'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
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
      submitButtonText,
    } = FormValidator.parse(body)
    if (!isFormStructure(fields)) {
      return NextResponse.json(
        { success: false, error: 'Invalid form structure' },
        { status: 422 },
      )
    }

    // Create the form in the database
    const form = await prisma.forms.create({
      data: {
        userId: session.user.id,

        // Request body
        title: title,
        description: description,
        fields: fields as unknown as Prisma.InputJsonValue,
        maxSubmissions: maxSubmissions,
        expiresAt: expiresAt,
        redirectUrl: redirectUrl,
        submitButtonText: submitButtonText,
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
          issues: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
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
