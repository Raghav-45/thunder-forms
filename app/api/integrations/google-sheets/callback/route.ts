import { GoogleSheetsConnectionStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptGoogleSheetsSecret, encryptGoogleSheetsSecret } from '@/features/google-sheets/server/crypto'
import { createGoogleSheetsOAuthClient } from '@/features/google-sheets/server/oauth'
import { GOOGLE_SHEETS_SCOPE } from '@/features/google-sheets/types'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function redirectToBuilder(request: NextRequest, formId: string, result: string) {
  const url = new URL(`/dashboard/builder/${formId}`, request.url)
  url.searchParams.set('googleSheets', result)
  return NextResponse.redirect(url)
}

function callbackFailureResult(error: unknown): string {
  if (error instanceof Error && error.message === 'invalid_client') {
    return 'invalid-client'
  }

  return 'failed'
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
    const candidate = await transaction.google_sheets_oauth_attempts.findUnique({
      where: { state },
    })
    if (
      !candidate ||
      candidate.userId !== session.user.id ||
      candidate.expiresAt <= new Date()
    ) {
      return null
    }

    const consumed = await transaction.google_sheets_oauth_attempts.deleteMany({
      where: { state, userId: session.user.id, expiresAt: { gt: new Date() } },
    })
    return consumed.count === 1 ? candidate : null
  })
  if (!attempt) return NextResponse.redirect(new URL('/dashboard', request.url))

  try {
    if (providerError || !code) {
      return redirectToBuilder(
        request,
        attempt.formId,
        providerError ? 'denied' : 'failed',
      )
    }

    const client = createGoogleSheetsOAuthClient()
    const { tokens } = await client.getToken({
      code,
      codeVerifier: decryptGoogleSheetsSecret(attempt.encryptedCodeVerifier),
    })
    if (!tokens.access_token) {
      return redirectToBuilder(request, attempt.formId, 'scope-denied')
    }
    const tokenInfo = await client.getTokenInfo(tokens.access_token)
    if (!tokenInfo.scopes.includes(GOOGLE_SHEETS_SCOPE)) {
      return redirectToBuilder(request, attempt.formId, 'scope-denied')
    }
    const grantedScopes = tokenInfo.scopes.join(' ')

    const existing = await prisma.google_sheets_connections.findUnique({
      where: { userId: attempt.userId },
    })
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptGoogleSheetsSecret(tokens.refresh_token)
      : existing?.encryptedRefreshToken
    if (!encryptedRefreshToken) {
      return redirectToBuilder(request, attempt.formId, 'missing-refresh-token')
    }

    await prisma.google_sheets_connections.upsert({
      where: { userId: attempt.userId },
      update: {
        encryptedRefreshToken,
        grantedScopes: grantedScopes || existing?.grantedScopes || '',
        status: GoogleSheetsConnectionStatus.ACTIVE,
      },
      create: {
        userId: attempt.userId,
        encryptedRefreshToken,
        grantedScopes,
        status: GoogleSheetsConnectionStatus.ACTIVE,
      },
    })

    return redirectToBuilder(request, attempt.formId, 'connected')
  } catch (error) {
    console.error('Google Sheets OAuth callback failed:', error)
    return redirectToBuilder(
      request,
      attempt.formId,
      callbackFailureResult(error),
    )
  }
}
