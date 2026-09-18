import { auth } from '@/lib/auth'
import {
  importGoogleForm,
  listGoogleForms,
} from '@/features/google-forms-import/server/forms'
import {
  consumeGoogleFormsImportSession,
  getGoogleFormsImportAccessToken,
  GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
  googleFormsImportCookieOptions,
} from '@/features/google-forms-import/server/session'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function googleErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  const response = (error as { response?: { status?: unknown } }).response
  return typeof response?.status === 'number' ? response.status : null
}

function isGoogleFormId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value)
}

async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id || null
}

function clearImportSession(response: NextResponse) {
  response.cookies.set(
    GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
    '',
    googleFormsImportCookieOptions(),
  )
  return response
}

export async function GET(request: NextRequest) {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getGoogleFormsImportAccessToken(request, userId)
    if (!accessToken) {
      return clearImportSession(
        NextResponse.json(
          { error: 'Google authorization expired. Connect Google again.' },
          { status: 401 },
        ),
      )
    }

    const pageToken = request.nextUrl.searchParams.get('pageToken')
    if (pageToken && pageToken.length > 1_000) {
      return NextResponse.json({ error: 'Invalid page token' }, { status: 400 })
    }

    return NextResponse.json(
      await listGoogleForms(accessToken, pageToken || undefined),
    )
  } catch (error) {
    console.error('Google Forms listing failed:', error)
    const status = googleErrorStatus(error)
    return NextResponse.json(
      {
        error:
          status === 401 || status === 403
            ? 'Google authorization expired. Connect Google again.'
            : 'Could not load Google Forms',
      },
      { status: status === 401 || status === 403 ? 401 : 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { formId } = await request.json()
    if (!isGoogleFormId(formId)) {
      return NextResponse.json(
        { error: 'Invalid Google Form selection' },
        { status: 400 },
      )
    }

    const accessToken = await getGoogleFormsImportAccessToken(request, userId)
    if (!accessToken) {
      return clearImportSession(
        NextResponse.json(
          { error: 'Google authorization expired. Connect Google again.' },
          { status: 401 },
        ),
      )
    }

    const result = await importGoogleForm(accessToken, formId)
    await consumeGoogleFormsImportSession(request, userId)
    return clearImportSession(NextResponse.json(result))
  } catch (error) {
    console.error('Google Forms import failed:', error)
    const status = googleErrorStatus(error)
    return NextResponse.json(
      {
        error:
          status === 404
            ? 'That Google Form is no longer available.'
            : status === 401 || status === 403
              ? 'Google authorization expired. Connect Google again.'
              : 'Could not import Google Form',
      },
      {
        status:
          status === 404 ? 404 : status === 401 || status === 403 ? 401 : 500,
      },
    )
  }
}
