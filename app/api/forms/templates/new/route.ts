import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()

    // Create the form in the database
    const template = await prisma.templates.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description,
        fields: body.fields,
        createdBy: 'Thunder Forms Team',
        thumbnailUrl: body.thumbnailUrl,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        id: template.id,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error('Error creating template:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template',
      },
      {
        status: 500,
      }
    )
    // } finally {
    //   await prisma.$disconnect()
  }
}
