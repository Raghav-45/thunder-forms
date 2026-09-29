import { createFileRoute } from '@tanstack/react-router'

import { GoogleSheetsConnectionStatus } from '@/generated/prisma/client'
import { prisma } from '@/db'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import { getPickerAccessToken } from '@/features/google-sheets/server/sheets'

export const Route = createFileRoute('/api/forms/$id/integrations/google-sheets/picker-token')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { userId } = await getOwnedGoogleSheetsForm(request, params.id)
          const connection = await prisma.google_sheets_connections.findUnique({
            where: { userId },
          })
          if (connection?.status !== GoogleSheetsConnectionStatus.ACTIVE) {
            return Response.json(
              { error: 'Connect Google before choosing a spreadsheet' },
              { status: 409 },
            )
          }
          return Response.json(
            { accessToken: await getPickerAccessToken(connection.encryptedRefreshToken) },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        } catch (error) {
          return googleSheetsErrorResponse(error)
        }
      },
    },
  },
})
