import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()

    // Create the form in the database
    const form = await prisma.forms.create({
      data: {
        title: body.formName,
        description: body.formDescription || '',
        fields: body.formFields,
      },
    })

    // Return success response
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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create form',
      },
      {
        status: 500,
      }
    )
  // } finally {
  //   await prisma.$disconnect()
  }
}
