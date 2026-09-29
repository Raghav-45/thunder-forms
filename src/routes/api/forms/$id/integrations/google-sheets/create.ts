import { createFileRoute } from '@tanstack/react-router'

import { GoogleSheetsConnectionStatus, Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db'
import { isFormStructure } from '@/features/form-builder/form-structure'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import { createGoogleSheetsHeaders } from '@/features/google-sheets/server/schema'
import {
  createManagedSpreadsheet,
  deleteManagedSpreadsheet,
  type GoogleSpreadsheetTarget,
} from '@/features/google-sheets/server/sheets'
import {
  acquireGoogleSheetsSetupLock,
  releaseGoogleSheetsSetupLock,
} from '@/features/google-sheets/server/setup-lock'

export const Route = createFileRoute('/api/forms/$id/integrations/google-sheets/create')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { form, userId } = await getOwnedGoogleSheetsForm(request, params.id)
          if (!isFormStructure(form.fields)) {
            return Response.json({ error: 'Form structure is invalid' }, { status: 422 })
          }

          const [connection, existingIntegration] = await Promise.all([
            prisma.google_sheets_connections.findUnique({ where: { userId } }),
            prisma.google_sheets_integrations.findUnique({ where: { formId: params.id } }),
          ])
          if (existingIntegration) {
            return Response.json(
              { error: 'This form already has a Google Sheets destination' },
              { status: 409 },
            )
          }
          if (connection?.status !== GoogleSheetsConnectionStatus.ACTIVE) {
            return Response.json(
              { error: 'Connect Google before creating a response sheet' },
              { status: 409 },
            )
          }

          await acquireGoogleSheetsSetupLock(params.id, userId)
          let target: GoogleSpreadsheetTarget | null = null
          try {
            const headers = createGoogleSheetsHeaders(form.fields)
            target = await createManagedSpreadsheet(
              connection.encryptedRefreshToken,
              form.title,
              headers,
            )
            const integration = await prisma.google_sheets_integrations.create({
              data: {
                formId: params.id,
                connectionId: connection.id,
                headers: headers as unknown as Prisma.InputJsonValue,
                ...target,
              },
            })
            return Response.json({ id: integration.id }, { status: 201 })
          } catch (error) {
            if (target) {
              await deleteManagedSpreadsheet(
                connection.encryptedRefreshToken,
                target.spreadsheetId,
              ).catch((cleanupError) =>
                console.error('Google Sheets workbook cleanup failed:', cleanupError),
              )
            }
            throw error
          } finally {
            await releaseGoogleSheetsSetupLock(params.id, userId)
          }
        } catch (error) {
          return googleSheetsErrorResponse(error)
        }
      },
    },
  },
})
