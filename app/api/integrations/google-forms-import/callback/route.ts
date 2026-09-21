import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import {
  GOOGLE_FORMS_IMPORT_OAUTH_RESULT_QUERY_PARAM,
  GOOGLE_FORMS_IMPORT_SCOPES,
} from '@/features/google-forms-import/constants'
import {
  createGoogleFormsImportOAuthClient,
} from '@/features/google-forms-import/server/oauth'
import {
  createGoogleFormsImportSessionId,
  encryptTemporaryGoogleFormsAccessToken,
  GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
  googleFormsImportCookieOptions,
  googleFormsImportSessionExpiresAt,
} from '@/features/google-forms-import/server/session'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function redirectToBuilder(request: NextRequest, returnTo: string, result: string) {
  const url = new URL(returnTo, request.url)
  url.searchParams.set(GOOGLE_FORMS_IMPORT_OAUTH_RESULT_QUERY_PARAM, result)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state')
  const code = request.nextUrl.searchParams.get('code')
  const providerError = request.nextUrl.searchParams.get('error')
  if (!state) return NextResponse.redirect(new URL('/dashboard', request.url))

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const attempt = await prisma.$transaction(async (transaction) => {
    const candidate = await transaction.google_forms_import_attempts.findUnique({
      where: { state },
    })
    if (
      !candidate ||
      candidate.userId !== session.user.id ||
      candidate.expiresAt <= new Date() ||
      !candidate.encryptedCodeVerifier
    ) {
      return null
    }

    const consumed = await transaction.google_forms_import_attempts.deleteMany({
      where: {
        state,
        userId: session.user.id,
        expiresAt: { gt: new Date() },
        encryptedCodeVerifier: { not: null },
      },
    })
    return consumed.count === 1 ? candidate : null
  })
  if (!attempt) return NextResponse.redirect(new URL('/dashboard', request.url))

  if (providerError || !code) {
    return redirectToBuilder(request, attempt.returnTo, 'denied')
  }

  const encryptedCodeVerifier = attempt.encryptedCodeVerifier
  if (!encryptedCodeVerifier) {
    return redirectToBuilder(request, attempt.returnTo, 'failed')
  }

  try {
    const client = createGoogleFormsImportOAuthClient()
    const { tokens } = await client.getToken({
      code,
      codeVerifier: decryptGoogleOAuthSecret(encryptedCodeVerifier),
    })
    if (!tokens.access_token) {
      return redirectToBuilder(request, attempt.returnTo, 'scope-denied')
    }

    const tokenInfo = await client.getTokenInfo(tokens.access_token)
    const grantedScopes = tokenInfo.scopes || []
    if (!GOOGLE_FORMS_IMPORT_SCOPES.every((scope) => grantedScopes.includes(scope))) {
      return redirectToBuilder(request, attempt.returnTo, 'scope-denied')
    }

    const importSessionId = createGoogleFormsImportSessionId()
    const expiresAt = new Date(
      Math.min(
        tokens.expiry_date || googleFormsImportSessionExpiresAt().getTime(),
        googleFormsImportSessionExpiresAt().getTime(),
      ),
    )
    await prisma.google_forms_import_attempts.create({
      data: {
        state: importSessionId,
        encryptedAccessToken: encryptTemporaryGoogleFormsAccessToken(
          tokens.access_token,
        ),
        userId: session.user.id,
        returnTo: attempt.returnTo,
        expiresAt,
      },
    })

    const response = redirectToBuilder(request, attempt.returnTo, 'connected')
    response.cookies.set(
      GOOGLE_FORMS_IMPORT_SESSION_COOKIE,
      importSessionId,
      googleFormsImportCookieOptions(
        Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
      ),
    )
    return response
  } catch (error) {
    console.error('Google Forms import OAuth callback failed:', error)
    return redirectToBuilder(request, attempt.returnTo, 'failed')
  }
}
