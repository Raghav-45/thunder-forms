import { createFileRoute } from '@tanstack/react-router'

import {
  GoogleSheetsConnectionStatus,
  GoogleSheetsDeliveryStatus,
  GoogleSheetsIntegrationStatus,
  Prisma,
} from '@/generated/prisma/client'
import { prisma } from '@/db'
import { isFormStructure } from '@/features/form-builder/form-structure'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import {
  isGoogleSheetsHeaders,
  reconcileGoogleSheetsHeaders,
} from '@/features/google-sheets/server/schema'
import { updateManagedSheetHeaders } from '@/features/google-sheets/server/sheets'

export const Route = createFileRoute('/api/forms/$id/integrations/google-sheets')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { userId } = await getOwnedGoogleSheetsForm(request, params.id)
          const [connection, integration] = await Promise.all([
            prisma.google_sheets_connections.findUnique({ where: { userId } }),
            prisma.google_sheets_integrations.findUnique({
              where: { formId: params.id },
              include: {
                _count: {
                  select: {
                    deliveries: {
                      where: {
                        status: {
                          in: [
                            GoogleSheetsDeliveryStatus.PENDING,
                            GoogleSheetsDeliveryStatus.PROCESSING,
                            GoogleSheetsDeliveryStatus.RETRY,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            }),
          ])
          const failedCount = integration
            ? await prisma.google_sheets_deliveries.count({
                where: {
                  integrationId: integration.id,
                  status: GoogleSheetsDeliveryStatus.FAILED,
                },
              })
            : 0

          return Response.json({
            connection: connection ? { status: connection.status } : null,
            integration: integration
              ? {
                  status: integration.status,
                  spreadsheetTitle: integration.spreadsheetTitle,
                  spreadsheetUrl: integration.spreadsheetUrl,
                  sheetTitle: integration.sheetTitle,
                  lastSyncedAt: integration.lastSyncedAt,
                  lastError: integration.lastError,
                  pendingCount: integration._count.deliveries,
                  failedCount,
                }
              : null,
          })
        } catch (error) {
          return googleSheetsErrorResponse(error)
        }
      },
      PATCH: async ({ params, request }) => {
        try {
          const { form } = await getOwnedGoogleSheetsForm(request, params.id)
          const body = await request.json()
          const status = body?.status
          if (
            status !== GoogleSheetsIntegrationStatus.ACTIVE &&
            status !== GoogleSheetsIntegrationStatus.PAUSED
          ) {
            return Response.json({ error: 'Invalid integration status' }, { status: 400 })
          }

          if (status === GoogleSheetsIntegrationStatus.ACTIVE) {
            const integration = await prisma.google_sheets_integrations.findUnique({
              where: { formId: params.id },
              include: { connection: true },
            })
            if (!integration) {
              return Response.json({ error: 'Google Sheets is not connected' }, { status: 404 })
            }
            if (integration.connection.status !== GoogleSheetsConnectionStatus.ACTIVE) {
              return Response.json(
                { error: 'Reconnect Google before resuming sync' },
                { status: 409 },
              )
            }
            if (!isGoogleSheetsHeaders(integration.headers)) {
              return Response.json(
                { error: 'Google Sheets integration headers are invalid' },
                { status: 409 },
              )
            }
            if (!isFormStructure(form.fields)) {
              return Response.json({ error: 'Form structure is invalid' }, { status: 422 })
            }

            const nextHeaders = reconcileGoogleSheetsHeaders(
              integration.headers,
              form.fields,
            )
            await updateManagedSheetHeaders(
              integration.connection.encryptedRefreshToken,
              integration.spreadsheetId,
              integration.sheetId,
              nextHeaders,
            )
            const [updated] = await prisma.$transaction([
              prisma.google_sheets_integrations.update({
                where: { formId: params.id },
                data: {
                  status,
                  headers: nextHeaders as unknown as Prisma.InputJsonValue,
                },
              }),
              prisma.google_sheets_deliveries.updateMany({
                where: {
                  integrationId: integration.id,
                  status: GoogleSheetsDeliveryStatus.FAILED,
                },
                data: {
                  status: GoogleSheetsDeliveryStatus.RETRY,
                  nextAttemptAt: new Date(),
                  lockedAt: null,
                  lockedBy: null,
                },
              }),
            ])
            return Response.json({ status: updated.status })
          }

          const integration = await prisma.google_sheets_integrations.update({
            where: { formId: params.id },
            data: { status },
          })
          return Response.json({ status: integration.status })
        } catch (error) {
          return googleSheetsErrorResponse(error)
        }
      },
      DELETE: async ({ params, request }) => {
        try {
          await getOwnedGoogleSheetsForm(request, params.id)
          await prisma.google_sheets_integrations.delete({
            where: { formId: params.id },
          })
          return Response.json({ success: true })
        } catch (error) {
          return googleSheetsErrorResponse(error)
        }
      },
    },
  },
})
