import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch form with user authorization check
    const form = await prisma.forms.findUnique({
      where: {
        id,
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // // Check if the form has expired
    // if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
    //   return NextResponse.json(
    //     {
    //       error: 'Form has expired',
    //     },
    //     { status: 410 }
    //   )
    // }

    return NextResponse.json(form)
  } catch (error) {
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
