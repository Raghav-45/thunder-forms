import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session retrieval errors
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Parse request body
    let updateData
    try {
      updateData = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate that we have data to update
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    // Check if form exists and user has permission
    const existingForm = await prisma.forms.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // // Check if form has expired (optional: prevent updates to expired forms)
    // if (
    //   existingForm.expiresAt &&
    //   new Date(existingForm.expiresAt) < new Date()
    // ) {
    //   return NextResponse.json(
    //     { error: 'Cannot update expired form' },
    //     { status: 410 }
    //   )
    // }

    // Update the form with the new data
    const updatedForm = await prisma.forms.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        fields: updateData.fields,
        maxSubmissions: updateData.maxSubmissions,
        expiresAt: updateData.expiresAt,
        redirectUrl: updateData.redirectUrl,
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
  } finally {
    // No need to disconnect when using shared Prisma instance
    // The singleton handles connection management
  }
}
