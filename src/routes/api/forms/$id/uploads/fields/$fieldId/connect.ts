import { createFileRoute } from '@tanstack/react-router'

import { prisma } from '@/db'
import { encryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import {
  createGoogleDriveAuthorizationUrl,
  createGoogleDriveAuthorizationValues,
} from '@/features/file-uploads/server/google-drive'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadField,
} from '@/features/file-uploads/server/owner'

export const Route = createFileRoute('/api/forms/$id/uploads/fields/$fieldId/connect')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { userId } = await getOwnedFileUploadField(
            request,
            params.id,
            params.fieldId,
          )
          const { state, codeVerifier, codeChallenge } =
            createGoogleDriveAuthorizationValues()
          await prisma.file_upload_oauth_attempts.deleteMany({
            where: { userId, formId: params.id, fieldId: params.fieldId },
          })
          await prisma.file_upload_oauth_attempts.create({
            data: {
              state,
              encryptedCodeVerifier: encryptGoogleOAuthSecret(codeVerifier),
              userId,
              formId: params.id,
              fieldId: params.fieldId,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
          })
          return Response.json({
            authorizationUrl: createGoogleDriveAuthorizationUrl(state, codeChallenge),
          })
        } catch (error) {
          return fileUploadErrorResponse(error)
        }
      },
    },
  },
})
