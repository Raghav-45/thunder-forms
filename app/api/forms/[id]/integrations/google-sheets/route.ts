import {
  GoogleSheetsConnectionStatus,
  GoogleSheetsDeliveryStatus,
  GoogleSheetsIntegrationStatus,
} from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import {
  isGoogleSheetsHeaders,
  reconcileGoogleSheetsHeaders,
} from '@/features/google-sheets/server/schema'
import { updateManagedSheetHeaders } from '@/features/google-sheets/server/sheets'
import { isFormStructure } from '@/features/form-builder/form-structure'
import { NextRequest, NextResponse } from 'next/server'

async function paramsFormId(
  params: Promise<{ id: string }>,
): Promise<string> {
  return (await params).id
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const formId = await paramsFormId(params)
    const { userId } = await getOwnedGoogleSheetsForm(formId)
    const [connection, integration] = await Promise.all([
      prisma.google_sheets_connections.findUnique({ where: { userId } }),
      prisma.google_sheets_integrations.findUnique({
        where: { formId },
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

    return NextResponse.json({
      connection: connection
        ? { status: connection.status }
        : null,
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
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const formId = await paramsFormId(params)
    const { form, userId } = await getOwnedGoogleSheetsForm(formId)
    const body = await request.json()
    const status = body?.status

    if (
      status !== GoogleSheetsIntegrationStatus.ACTIVE &&
      status !== GoogleSheetsIntegrationStatus.PAUSED
    ) {
      return NextResponse.json({ error: 'Invalid integration status' }, { status: 400 })
    }

    if (status === GoogleSheetsIntegrationStatus.ACTIVE) {
      const integration = await prisma.google_sheets_integrations.findUnique({
        where: { formId },
        include: { connection: true },
      })
      if (!integration) {
        return NextResponse.json({ error: 'Google Sheets is not connected' }, { status: 404 })
      }
      if (integration.connection.status !== GoogleSheetsConnectionStatus.ACTIVE) {
        return NextResponse.json(
          { error: 'Reconnect Google before resuming sync' },
          { status: 409 },
        )
      }
      if (!isGoogleSheetsHeaders(integration.headers)) {
        return NextResponse.json(
          { error: 'Google Sheets integration headers are invalid' },
          { status: 409 },
        )
      }
      if (!isFormStructure(form.fields)) {
        return NextResponse.json({ error: 'Form structure is invalid' }, { status: 422 })
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
          where: { formId },
          data: {
            status,
            headers: nextHeaders as unknown as Prisma.InputJsonValue,
          },
        }),
        prisma.google_sheets_deliveries.updateMany({
          where: { integrationId: integration.id, status: GoogleSheetsDeliveryStatus.FAILED },
          data: {
            status: GoogleSheetsDeliveryStatus.RETRY,
            nextAttemptAt: new Date(),
            lockedAt: null,
            lockedBy: null,
          },
        }),
      ])
      return NextResponse.json({ status: updated.status })
    }

    const integration = await prisma.google_sheets_integrations.update({
      where: { formId },
      data: { status },
    })
    return NextResponse.json({ status: integration.status })
  } catch (error) {
    return googleSheetsErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const formId = await paramsFormId(params)
    await getOwnedGoogleSheetsForm(formId)
    await prisma.google_sheets_integrations.delete({ where: { formId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return googleSheetsErrorResponse(error)
  }
}
