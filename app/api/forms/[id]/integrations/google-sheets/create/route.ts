import { GoogleSheetsConnectionStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { isFormStructure } from '@/features/form-builder/form-structure'
import { createGoogleSheetsHeaders } from '@/features/google-sheets/server/schema'
import {
  createManagedSpreadsheet,
  deleteManagedSpreadsheet,
  type GoogleSpreadsheetTarget,
} from '@/features/google-sheets/server/sheets'
import {
  drainGoogleSheetsDeliveries,
  enqueueGoogleSheetsResponseBackfill,
} from '@/features/google-sheets/server/deliveries'
import {
  acquireGoogleSheetsSetupLock,
  releaseGoogleSheetsSetupLock,
} from '@/features/google-sheets/server/setup-lock'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import { prisma } from '@/lib/prisma'
import { after, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const { form, userId } = await getOwnedGoogleSheetsForm(formId)
    if (!isFormStructure(form.fields)) {
      return NextResponse.json({ error: 'Form structure is invalid' }, { status: 422 })
    }

    const [connection, existingIntegration] = await Promise.all([
      prisma.google_sheets_connections.findUnique({ where: { userId } }),
      prisma.google_sheets_integrations.findUnique({ where: { formId } }),
    ])
    if (existingIntegration) {
      return NextResponse.json(
        { error: 'This form already has a Google Sheets destination' },
        { status: 409 },
      )
    }
    if (connection?.status !== GoogleSheetsConnectionStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Connect Google before creating a response sheet' },
        { status: 409 },
      )
    }

    await acquireGoogleSheetsSetupLock(formId, userId)
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
          formId,
          connectionId: connection.id,
          headers: headers as unknown as Prisma.InputJsonValue,
          ...target,
        },
      })
      await enqueueGoogleSheetsResponseBackfill(
        integration.id,
        formId,
        headers,
      )
      after(async () => {
        try {
          await drainGoogleSheetsDeliveries(randomUUID())
        } catch (error) {
          console.error('Google Sheets backfill sync failed:', error)
        }
      })

      return NextResponse.json({ id: integration.id }, { status: 201 })
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
      await releaseGoogleSheetsSetupLock(formId, userId)
    }
  } catch (error) {
    return googleSheetsErrorResponse(error)
  }
}
