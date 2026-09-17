import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getFormStatus } from '../../utils'
import { isFormStructure } from '@/features/form-builder/form-structure'

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
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (!isFormStructure(form.fields)) {
      return NextResponse.json(
        { error: 'Form is unavailable' },
        { status: 422 },
      )
    }

    // Calculate status using _count but exclude it from response
    const status = getFormStatus(
      form._count.responses,
      form.maxSubmissions,
      form.expiresAt ? form.expiresAt.toISOString() : null
    )

    // Destructure to exclude _count from the response (users shouldn't see internal response count)
    // and userId (form owners stay private on the public endpoint)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _count, userId, ...formWithoutCount } = form

    // Add status to form response (without _count)
    const formWithStatus = {
      ...formWithoutCount,
      status,
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

    return NextResponse.json(formWithStatus)
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
