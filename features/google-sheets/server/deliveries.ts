import {
  GoogleSheetsConnectionStatus,
  GoogleSheetsDeliveryStatus,
  GoogleSheetsIntegrationStatus,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  appendGoogleSheetsRow,
  hasGoogleSheetsSubmission,
} from './sheets'
import { createGoogleSheetsRow } from './schema'
import type { GoogleSheetsColumn } from '@/features/google-sheets/types'

const MAX_ATTEMPTS = 8
const LOCK_TIMEOUT_MS = 10 * 60 * 1000

function responseData(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export async function enqueueGoogleSheetsResponseBackfill(
  integrationId: string,
  formId: string,
  headers: GoogleSheetsColumn[],
): Promise<number> {
  const responses = await prisma.responses.findMany({
    where: { formsId: formId },
    select: { id: true, createdAt: true, data: true },
    orderBy: { createdAt: 'asc' },
  })

  await prisma.$transaction(async (transaction) => {
    for (const response of responses) {
      await transaction.google_sheets_deliveries.upsert({
        where: {
          integrationId_responseId: {
            integrationId,
            responseId: response.id,
          },
        },
        create: {
          integrationId,
          responseId: response.id,
          row: createGoogleSheetsRow(
            headers,
            response.id,
            response.createdAt,
            responseData(response.data),
          ),
        },
        update: {},
      })
    }
  })

  return responses.length
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const response = (error as { response?: { status?: unknown } }).response
  return typeof response?.status === 'number' ? response.status : undefined
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 1_000) : 'Google Sheets sync failed'
}

function isTransientError(error: unknown): boolean {
  const status = errorStatus(error)
  return status === 429 || (status !== undefined && status >= 500) || !status
}

export function nextGoogleSheetsRetryAt(
  attemptCount: number,
  now = new Date(),
): Date {
  const baseDelayMs = Math.min(60_000 * 2 ** Math.max(0, attemptCount - 1), 3_600_000)
  const jitterMs = Math.floor(Math.random() * 15_000)
  return new Date(now.getTime() + baseDelayMs + jitterMs)
}

export async function syncGoogleSheetsDelivery(deliveryId: string, workerId: string) {
  const delivery = await prisma.google_sheets_deliveries.findUnique({
    where: { id: deliveryId },
    include: { integration: { include: { connection: true } } },
  })
  if (!delivery || delivery.status !== GoogleSheetsDeliveryStatus.PROCESSING || delivery.lockedBy !== workerId) {
    return
  }

  try {
    const row = Array.isArray(delivery.row)
      ? delivery.row.map((value) => String(value))
      : null
    if (!row) throw new Error('Google Sheets delivery row is invalid')

    const token = delivery.integration.connection.encryptedRefreshToken
    const hasExistingRow =
      delivery.attemptCount > 1 &&
      (await hasGoogleSheetsSubmission(
        token,
        delivery.integration.spreadsheetId,
        delivery.integration.sheetId,
        row[0],
      ))

    const updatedRange = hasExistingRow
      ? null
      : await appendGoogleSheetsRow(
          token,
          delivery.integration.spreadsheetId,
          delivery.integration.sheetId,
          row,
        )
    const now = new Date()

    await prisma.$transaction([
      prisma.google_sheets_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: GoogleSheetsDeliveryStatus.SYNCED,
          syncedAt: now,
          updatedRange,
          lastError: null,
          lastErrorCode: null,
          lockedAt: null,
          lockedBy: null,
        },
      }),
      prisma.google_sheets_integrations.update({
        where: { id: delivery.integrationId },
        data: { lastSyncedAt: now, lastError: null },
      }),
    ])
  } catch (error) {
    const status = errorStatus(error)
    const code = errorCode(error)
    const message = errorMessage(error)
    const terminal = delivery.attemptCount >= MAX_ATTEMPTS || !isTransientError(error)

    await prisma.$transaction(async (transaction) => {
      if (status === 401 || code === 'invalid_grant') {
        await transaction.google_sheets_connections.update({
          where: { id: delivery.integration.connectionId },
          data: { status: GoogleSheetsConnectionStatus.REAUTH_REQUIRED },
        })
      }

      await transaction.google_sheets_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: terminal
            ? GoogleSheetsDeliveryStatus.FAILED
            : GoogleSheetsDeliveryStatus.RETRY,
          nextAttemptAt: terminal
            ? delivery.nextAttemptAt
            : nextGoogleSheetsRetryAt(delivery.attemptCount),
          lastError: message,
          lastErrorCode: code || (status ? String(status) : null),
          lockedAt: null,
          lockedBy: null,
        },
      })

      if (terminal) {
        await transaction.google_sheets_integrations.update({
          where: { id: delivery.integrationId },
          data: {
            status: GoogleSheetsIntegrationStatus.PAUSED,
            lastError: message,
          },
        })
      }
    })
  }
}

export async function drainGoogleSheetsDeliveries(
  workerId: string,
  limit = 25,
) {
  const now = new Date()
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS)
  const candidates = await prisma.google_sheets_deliveries.findMany({
    where: {
      OR: [
        {
          status: { in: [GoogleSheetsDeliveryStatus.PENDING, GoogleSheetsDeliveryStatus.RETRY] },
          nextAttemptAt: { lte: now },
        },
        {
          status: GoogleSheetsDeliveryStatus.PROCESSING,
          lockedAt: { lte: staleLock },
        },
      ],
      integration: { status: GoogleSheetsIntegrationStatus.ACTIVE },
    },
    orderBy: { nextAttemptAt: 'asc' },
    select: { id: true },
    take: limit,
  })

  let claimed = 0
  for (const candidate of candidates) {
    const result = await prisma.google_sheets_deliveries.updateMany({
      where: {
        id: candidate.id,
        OR: [
          {
            status: { in: [GoogleSheetsDeliveryStatus.PENDING, GoogleSheetsDeliveryStatus.RETRY] },
            nextAttemptAt: { lte: now },
          },
          {
            status: GoogleSheetsDeliveryStatus.PROCESSING,
            lockedAt: { lte: staleLock },
          },
        ],
      },
      data: {
        status: GoogleSheetsDeliveryStatus.PROCESSING,
        lockedAt: now,
        lockedBy: workerId,
        attemptCount: { increment: 1 },
      },
    })
    if (result.count !== 1) continue

    claimed += 1
    await syncGoogleSheetsDelivery(candidate.id, workerId)
  }

  return claimed
}
