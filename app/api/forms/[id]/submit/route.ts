import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { validateFormFields } from '@/features/form-builder/utils/formValidation'
import type { FieldConfig } from '@/features/form-builder/elements'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params
    const body = await request.json()
    const { data } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Form data is required and must be an object' },
        { status: 400 }
      )
    }

    // First, verify the form exists and get its settings and fields
    const form = await prisma.forms.findUnique({
      where: { id: formId },
      select: {
        id: true,
        fields: true, // Include fields for validation
        expiresAt: true,
        maxSubmissions: true,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if form has expired
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Form has expired' },
        { status: 410 }
      )
    }

    // Check if form has reached maximum submissions
    if (form.maxSubmissions && form._count.responses >= form.maxSubmissions) {
      return NextResponse.json(
        { error: 'Form has reached maximum submissions limit' },
        { status: 410 }
      )
    }

    // Server-side validation using the same validation logic as client-side
    const fields = form.fields as unknown as FieldConfig[]
    const validationErrors = validateFormFields(fields, data)
    
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors,
          message: 'Please check your form data and try again'
        },
        { status: 422 }
      )
    }

    // Security check: Only allow data for fields that exist in the form schema
    const allowedFieldIds = new Set(fields.map(field => field.id))
    const sanitizedData: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFieldIds.has(key)) {
        sanitizedData[key] = value
      }
    }

    // Create the response with sanitized data
    const response = await prisma.responses.create({
      data: {
        formsId: formId,
        data: JSON.parse(JSON.stringify(sanitizedData)), // Ensure proper JSON serialization
      },
    })

    return NextResponse.json(
      { 
        message: 'Form submitted successfully',
        responseId: response.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Form submission error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to submit form',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
