import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id

    // Fetch form with its responses
    const formWithResponses = await prisma.forms.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: {
            createdAt: 'desc', // Get newest responses first
          },
        },
      },
    })

    if (!formWithResponses) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (formWithResponses.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      formId: formWithResponses.id,
      title: formWithResponses.title,
      responses: formWithResponses.responses,
    })
  } catch (error) {
    console.error('Get form responses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form responses' },
      { status: 500 }
    )
  }
}