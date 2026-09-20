import { prisma } from '@/lib/prisma'
import { encryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import {
  createGoogleSheetsAuthorizationUrl,
  createOAuthAttemptValues,
} from '@/features/google-sheets/server/oauth'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const { userId } = await getOwnedGoogleSheetsForm(formId)
    const { state, codeVerifier, codeChallenge } = createOAuthAttemptValues()

    await prisma.google_sheets_oauth_attempts.deleteMany({
      where: { userId, formId },
    })
    await prisma.google_sheets_oauth_attempts.create({
      data: {
        state,
        encryptedCodeVerifier: encryptGoogleOAuthSecret(codeVerifier),
        userId,
        formId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    return NextResponse.json({
      authorizationUrl: createGoogleSheetsAuthorizationUrl(state, codeChallenge),
    })
  } catch (error) {
    return googleSheetsErrorResponse(error)
  }
}
