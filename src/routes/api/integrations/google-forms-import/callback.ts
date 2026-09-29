import { createFileRoute } from '@tanstack/react-router'

import { prisma } from '@/db'
import { decryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import {
  GOOGLE_FORMS_IMPORT_OAUTH_RESULT_QUERY_PARAM,
  GOOGLE_FORMS_IMPORT_SCOPES,
} from '@/features/google-forms-import/constants'
import { createGoogleFormsImportOAuthClient } from '@/features/google-forms-import/server/oauth'
import {
  createGoogleFormsImportSessionId,
  encryptTemporaryGoogleFormsAccessToken,
  googleFormsImportSessionExpiresAt,
  setGoogleFormsImportCookie,
} from '@/features/google-forms-import/server/session'
import { getSessionUserId } from '@/lib/server/session'

function redirectToBuilder(request: Request, returnTo: string, result: string) {
  const url = new URL(returnTo, request.url)
  url.searchParams.set(GOOGLE_FORMS_IMPORT_OAUTH_RESULT_QUERY_PARAM, result)
  return Response.redirect(url)
}

export const Route = createFileRoute('/api/integrations/google-forms-import/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const state = url.searchParams.get('state')
        const code = url.searchParams.get('code')
        const providerError = url.searchParams.get('error')
        if (!state) return Response.redirect(new URL('/dashboard', request.url))

        const userId = await getSessionUserId(request)
        if (!userId) return Response.redirect(new URL('/dashboard', request.url))

        const attempt = await prisma.$transaction(async (transaction) => {
          const candidate = await transaction.google_forms_import_attempts.findUnique({
            where: { state },
          })
          if (
            !candidate ||
            candidate.userId !== userId ||
            candidate.expiresAt <= new Date() ||
            !candidate.encryptedCodeVerifier
          ) {
            return null
          }

          const consumed = await transaction.google_forms_import_attempts.deleteMany({
            where: {
              state,
              userId,
              expiresAt: { gt: new Date() },
              encryptedCodeVerifier: { not: null },
            },
          })
          return consumed.count === 1 ? candidate : null
        })
        if (!attempt) return Response.redirect(new URL('/dashboard', request.url))

        if (providerError || !code) {
          return redirectToBuilder(request, attempt.returnTo, 'denied')
        }

        try {
          const client = createGoogleFormsImportOAuthClient()
          const { tokens } = await client.getToken({
            code,
            codeVerifier: decryptGoogleOAuthSecret(attempt.encryptedCodeVerifier!),
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
              userId,
              returnTo: attempt.returnTo,
              expiresAt,
            },
          })

          return setGoogleFormsImportCookie(
            redirectToBuilder(request, attempt.returnTo, 'connected'),
            importSessionId,
            Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
          )
        } catch (error) {
          console.error('Google Forms import OAuth callback failed:', error)
          return redirectToBuilder(request, attempt.returnTo, 'failed')
        }
      },
    },
  },
})
