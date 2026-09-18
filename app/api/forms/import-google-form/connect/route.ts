import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptGoogleSheetsSecret } from '@/features/google-sheets/server/crypto'
import {
  createGoogleFormsImportAuthorizationUrl,
  createGoogleFormsImportOAuthAttempt,
} from '@/features/google-forms-import/server/oauth'
import {
  GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
  googleFormsImportCookieOptions,
  googleFormsImportSessionExpiresAt,
} from '@/features/google-forms-import/server/session'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function isBuilderReturnTo(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\/dashboard\/builder\/[^/?#]+$/.test(value)
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { returnTo } = await request.json().catch(() => ({}))
    if (!isBuilderReturnTo(returnTo)) {
      return NextResponse.json({ error: 'Invalid return location' }, { status: 400 })
    }

    const { state, codeVerifier, codeChallenge } =
      createGoogleFormsImportOAuthAttempt()
    const expiresAt = googleFormsImportSessionExpiresAt()

    await prisma.$transaction([
      prisma.google_forms_import_attempts.deleteMany({
        where: {
          OR: [
            { userId: session.user.id },
            { expiresAt: { lte: new Date() } },
          ],
        },
      }),
      prisma.google_forms_import_attempts.create({
        data: {
          state,
          encryptedCodeVerifier: encryptGoogleSheetsSecret(codeVerifier),
          userId: session.user.id,
          returnTo,
          expiresAt,
        },
      }),
    ])

    const response = NextResponse.json({
      authorizationUrl: createGoogleFormsImportAuthorizationUrl(
        state,
        codeChallenge,
      ),
    })
    response.cookies.set(
      GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
      state,
      googleFormsImportCookieOptions(10 * 60),
    )
    return response
  } catch (error) {
    console.error('Google Forms import authorization failed:', error)
    return NextResponse.json(
      { error: 'Could not start Google Forms import' },
      { status: 500 },
    )
  }
}
