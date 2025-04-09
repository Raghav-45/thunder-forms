import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = (await params).id
    const body = await request.json()

    // Validate the form exists
    const existingForm = await prisma.forms.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the form with the new data
    const updatedForm = await prisma.forms.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        fields: body.fields,
        maxSubmissions: body.maxSubmissions,
        expiresAt: body.expiresAt,
        redirectUrl: body.redirectUrl,
        // Add any other things you want to update here.
      },
    })

    return NextResponse.json(updatedForm)
  } catch (error) {
    console.error('Update form error:', error)
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}
