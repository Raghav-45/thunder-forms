import { randomBytes } from 'node:crypto'
import { decryptGoogleOAuthSecret, encryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import { prisma } from '@/lib/prisma'

const IMPORT_SESSION_COOKIE = 'thunderforms_google_forms_import'
const IMPORT_SESSION_DURATION_MS = 10 * 60 * 1000

export const GOOGLE_FORMS_IMPORT_SESSION_COOKIE = IMPORT_SESSION_COOKIE
export const GOOGLE_FORMS_IMPORT_SESSION_MAX_AGE_SECONDS = IMPORT_SESSION_DURATION_MS / 1000

export function googleFormsImportSessionExpiresAt(): Date {
  return new Date(Date.now() + IMPORT_SESSION_DURATION_MS)
}

export function createGoogleFormsImportSessionId(): string {
  return randomBytes(32).toString('base64url')
}

export function getGoogleFormsImportSessionCookie(
  request: Request,
): string | null {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  const value = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${IMPORT_SESSION_COOKIE}=`))
    ?.slice(IMPORT_SESSION_COOKIE.length + 1)

  return value || null
}

export async function getGoogleFormsImportAccessToken(
  request: Request,
  userId: string,
): Promise<string | null> {
  const state = getGoogleFormsImportSessionCookie(request)
  if (!state) return null

  const attempt = await prisma.google_forms_import_attempts.findFirst({
    where: {
      state,
      userId,
      expiresAt: { gt: new Date() },
      encryptedAccessToken: { not: null },
    },
    select: { encryptedAccessToken: true },
  })
  if (!attempt?.encryptedAccessToken) return null

  return decryptGoogleOAuthSecret(attempt.encryptedAccessToken)
}

export async function consumeGoogleFormsImportSession(
  request: Request,
  userId: string,
) {
  const state = getGoogleFormsImportSessionCookie(request)
  if (!state) return

  await prisma.google_forms_import_attempts.deleteMany({
    where: { state, userId },
  })
}

export function encryptTemporaryGoogleFormsAccessToken(accessToken: string) {
  return encryptGoogleOAuthSecret(accessToken)
}

export function googleFormsImportCookieOptions(maxAge = 0) {
  return {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}
