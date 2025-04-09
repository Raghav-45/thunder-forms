import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse the request body
    const body = await request.json()

    // Create the form in the database
    const form = await prisma.forms.create({
      data: {
        userId: session.user.id,
        title: body.formName,
        description: body.formDescription || '',
        fields: body.formFields,
        maxSubmissions: body.maxSubmissions || null,
        expiresAt: body.expiresAt || null,
        redirectUrl: body.redirectUrl || null,
      },
    })

    // Return success response with the created form
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
