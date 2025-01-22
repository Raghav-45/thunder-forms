import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Parse the request body
    const body = await request.json()
    const formId = params.id

    // Create the form response in the database
    const response = await prisma.response.create({
      data: {
        formsId: formId, // Changed from formId to formsId to match schema
        data: body, // Changed from response to data to match schema
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        id: response.id,
        createdAt: response.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating form response:', error)

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data provided',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create form response',
      },
      { status: 500 }
    )
  }
}
