import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { importGoogleForm, extractFormId, isResponderLink } from '@/lib/google-forms-import'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Google Forms URL is required' },
        { status: 400 }
      )
    }

    if (isResponderLink(url)) {
      return NextResponse.json(
        { error: 'This is a sharing/responder link. Please use the edit link instead — open the form in Google Forms and copy the URL from the address bar (it should look like docs.google.com/forms/d/.../edit).' },
        { status: 400 }
      )
    }

    const formId = extractFormId(url)
    if (!formId) {
      return NextResponse.json(
        { error: 'Invalid Google Forms URL. Expected format: https://docs.google.com/forms/d/...' },
        { status: 400 }
      )
    }

    const result = await importGoogleForm(url)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Google Forms import error:', error)

    const statusCode = (error as { code?: number })?.code
    if (statusCode === 404) {
      return NextResponse.json(
        { error: 'Google Form not found. Check the URL and make sure the form is shared with the service account.' },
        { status: 404 }
      )
    }
    if (statusCode === 403) {
      return NextResponse.json(
        { error: 'No access to this form. Please share it with the service account email.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to import Google Form',
        message: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    )
  }
}
