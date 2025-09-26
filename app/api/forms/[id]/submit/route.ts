import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params
    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      )
    }

    // First, verify the form exists and get its settings
    const form = await prisma.forms.findUnique({
      where: { id: formId },
      select: {
        id: true,
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

    // Create the response
    const response = await prisma.responses.create({
      data: {
        formsId: formId,
        data: data,
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