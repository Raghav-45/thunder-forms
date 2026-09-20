import { encryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import {
  createGoogleDriveAuthorizationUrl,
  createGoogleDriveAuthorizationValues,
} from '@/features/file-uploads/server/google-drive'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadForm,
} from '@/features/file-uploads/server/owner'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const { userId } = await getOwnedFileUploadForm(formId)
    const { state, codeVerifier, codeChallenge } = createGoogleDriveAuthorizationValues()

    await prisma.file_upload_oauth_attempts.deleteMany({
      where: { userId, formId },
    })
    await prisma.file_upload_oauth_attempts.create({
      data: {
        state,
        encryptedCodeVerifier: encryptGoogleOAuthSecret(codeVerifier),
        userId,
        formId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    return NextResponse.json({
      authorizationUrl: createGoogleDriveAuthorizationUrl(state, codeChallenge),
    })
  } catch (error) {
    return fileUploadErrorResponse(error)
  }
}
