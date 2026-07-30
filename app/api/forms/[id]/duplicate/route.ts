import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existingForm = await prisma.forms.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const duplicatedForm = await prisma.forms.create({
      data: {
        userId: session.user.id,
        title: `${existingForm.title} (Copy)`,
        description: existingForm.description,
        fields: existingForm.fields!,
        maxSubmissions: existingForm.maxSubmissions,
        expiresAt: existingForm.expiresAt,
        redirectUrl: existingForm.redirectUrl,
        submitButtonText: existingForm.submitButtonText,
      },
    })

    return NextResponse.json(
      { success: true, id: duplicatedForm.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Duplicate form error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Database error occurred',
          message:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
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
