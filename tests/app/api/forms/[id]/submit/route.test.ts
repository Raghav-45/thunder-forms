import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createDelivery: vi.fn(),
  createResponse: vi.fn(),
  drainGoogleSheetsDeliveries: vi.fn(),
  findForm: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const original = await importOriginal<typeof import('next/server')>()
  return { ...original, after: mocks.after }
})

vi.mock('@/features/google-sheets/server/deliveries', () => ({
  drainGoogleSheetsDeliveries: mocks.drainGoogleSheetsDeliveries,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    forms: { findUnique: mocks.findForm },
    responses: { create: mocks.createResponse },
    google_sheets_deliveries: { create: mocks.createDelivery },
    $transaction: mocks.transaction,
  },
}))

import { POST } from '@/app/api/forms/[id]/submit/route'

const fields = {
  pages: [
    {
      id: 'page-1',
      sections: [
        {
          id: 'section-1',
          fields: [
            {
              id: 'email',
              label: 'Email',
              uniqueIdentifier: 'text-input',
              inputType: 'email',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

const storedForm = (overrides: Record<string, unknown> = {}) => ({
  id: 'form-1',
  fields,
  expiresAt: null,
  maxSubmissions: null,
  _count: { responses: 0 },
  ...overrides,
})

const requestFor = (data: unknown) =>
  new NextRequest('http://localhost/api/forms/form-1/submit', {
    method: 'POST',
    body: JSON.stringify({ data }),
    headers: { 'content-type': 'application/json' },
  })

const params = Promise.resolve({ id: 'form-1' })

describe('POST /api/forms/[id]/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findForm.mockResolvedValue(storedForm())
    mocks.createResponse.mockResolvedValue({
      id: 'response-1',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
    })
    mocks.drainGoogleSheetsDeliveries.mockResolvedValue(1)
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        forms: { findUnique: mocks.findForm },
        responses: { create: mocks.createResponse },
        google_sheets_deliveries: { create: mocks.createDelivery },
      }),
    )
  })

  it('returns 400 before querying the form for non-object data', async () => {
    const response = await POST(requestFor(null), { params })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Form data is required and must be an object',
    })
    expect(mocks.findForm).not.toHaveBeenCalled()
  })

  it('returns 404 when target form does not exist', async () => {
    mocks.findForm.mockResolvedValue(null)

    const response = await POST(requestFor({ email: 'person@example.com' }), { params })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Form not found' })
    expect(mocks.createResponse).not.toHaveBeenCalled()
  })

  it('returns 422 when stored form structure is invalid', async () => {
    mocks.findForm.mockResolvedValue(storedForm({ fields: { pages: [] } }))

    const response = await POST(requestFor({ email: 'person@example.com' }), { params })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Form structure is invalid' })
    expect(mocks.createResponse).not.toHaveBeenCalled()
  })

  it('returns 410 when form is expired', async () => {
    mocks.findForm.mockResolvedValue(
      storedForm({ expiresAt: new Date('2000-01-01T00:00:00.000Z') }),
    )

    const response = await POST(requestFor({ email: 'person@example.com' }), { params })

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({ error: 'Form has expired' })
    expect(mocks.createResponse).not.toHaveBeenCalled()
  })

  it('returns 410 when form has reached submission limit', async () => {
    mocks.findForm.mockResolvedValue(
      storedForm({ maxSubmissions: 1, _count: { responses: 1 } }),
    )

    const response = await POST(requestFor({ email: 'person@example.com' }), { params })

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Form has reached maximum submissions limit',
    })
    expect(mocks.createResponse).not.toHaveBeenCalled()
  })

  it('returns field validation errors without writing a response', async () => {
    const response = await POST(requestFor({ email: 'not-an-email' }), { params })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Validation failed',
      validationErrors: { email: 'Invalid email address' },
    })
    expect(mocks.createResponse).not.toHaveBeenCalled()
  })

  it('persists only fields defined by the form schema', async () => {
    const response = await POST(
      requestFor({ email: 'person@example.com', isAdmin: true }),
      { params },
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      message: 'Form submitted successfully',
      responseId: 'response-1',
    })
    expect(mocks.createResponse).toHaveBeenCalledWith({
      data: { formsId: 'form-1', data: { email: 'person@example.com' } },
    })
  })

  it('retries a serializable transaction conflict before persisting a response', async () => {
    mocks.transaction
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockImplementationOnce(async (callback) =>
        callback({
          forms: { findUnique: mocks.findForm },
          responses: { create: mocks.createResponse },
          google_sheets_deliveries: { create: mocks.createDelivery },
        }),
      )

    const response = await POST(
      requestFor({ email: 'person@example.com' }),
      { params },
    )

    expect(response.status).toBe(201)
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    expect(mocks.createResponse).toHaveBeenCalledTimes(1)
  })

  it('creates an immutable Sheets delivery with an active integration', async () => {
    mocks.findForm.mockResolvedValue(
      storedForm({
        googleSheetsIntegration: {
          id: 'integration-1',
          status: 'ACTIVE',
          headers: [
            { key: '__response_id', label: 'Submission ID' },
            { key: '__submitted_at', label: 'Submitted At' },
            { key: 'email', label: 'Email' },
          ],
        },
      }),
    )

    const response = await POST(
      requestFor({ email: 'person@example.com' }),
      { params },
    )

    expect(response.status).toBe(201)
    expect(mocks.createDelivery).toHaveBeenCalledWith({
      data: {
        integrationId: 'integration-1',
        responseId: 'response-1',
        row: ['response-1', '2026-09-18T00:00:00.000Z', 'person@example.com'],
      },
    })
    expect(mocks.after).toHaveBeenCalledTimes(1)
    await mocks.after.mock.calls[0][0]()
    expect(mocks.drainGoogleSheetsDeliveries).toHaveBeenCalledTimes(1)
  })

  it('does not queue a Sheets delivery while the integration is paused', async () => {
    mocks.findForm.mockResolvedValue(
      storedForm({
        googleSheetsIntegration: {
          id: 'integration-1',
          status: 'PAUSED',
          headers: [
            { key: '__response_id', label: 'Submission ID' },
            { key: '__submitted_at', label: 'Submitted At' },
            { key: 'email', label: 'Email' },
          ],
        },
      }),
    )

    const response = await POST(
      requestFor({ email: 'person@example.com' }),
      { params },
    )

    expect(response.status).toBe(201)
    expect(mocks.createDelivery).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
  })
})
