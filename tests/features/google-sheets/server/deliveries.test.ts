import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findResponses: vi.fn(),
  transaction: vi.fn(),
  upsertDelivery: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    responses: { findMany: mocks.findResponses },
    $transaction: mocks.transaction,
  },
}))

import {
  enqueueGoogleSheetsResponseBackfill,
  nextGoogleSheetsRetryAt,
} from '@/features/google-sheets/server/deliveries'

describe('Google Sheets delivery retry timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ google_sheets_deliveries: { upsert: mocks.upsertDelivery } }),
    )
  })

  afterEach(() => vi.restoreAllMocks())

  it('uses capped exponential backoff with bounded jitter', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const now = new Date('2026-09-18T00:00:00.000Z')

    expect(nextGoogleSheetsRetryAt(1, now)).toEqual(
      new Date('2026-09-18T00:01:00.000Z'),
    )
    expect(nextGoogleSheetsRetryAt(10, now)).toEqual(
      new Date('2026-09-18T01:00:00.000Z'),
    )
  })

  it('queues saved responses when a destination is connected later', async () => {
    mocks.findResponses.mockResolvedValue([
      {
        id: 'response-1',
        createdAt: new Date('2026-09-18T00:00:00.000Z'),
        data: { name: 'Aditya' },
      },
    ])

    await expect(
      enqueueGoogleSheetsResponseBackfill('integration-1', 'form-1', [
        { key: '__response_id', label: 'Submission ID' },
        { key: '__submitted_at', label: 'Submitted At' },
        { key: 'name', label: 'Name' },
      ]),
    ).resolves.toBe(1)

    expect(mocks.upsertDelivery).toHaveBeenCalledWith({
      where: {
        integrationId_responseId: {
          integrationId: 'integration-1',
          responseId: 'response-1',
        },
      },
      create: {
        integrationId: 'integration-1',
        responseId: 'response-1',
        row: ['response-1', '2026-09-18T00:00:00.000Z', 'Aditya'],
      },
      update: {},
    })
  })
})
