import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createResponse: vi.fn(),
  findForm: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    forms: { findUnique: mocks.findForm },
    responses: { create: mocks.createResponse },
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
    mocks.createResponse.mockResolvedValue({ id: 'response-1' })
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

  it('creates no more responses than configured limit under concurrent submits', async () => {
    let findCalls = 0
    let releaseReads = () => {}
    const bothReadsStarted = new Promise<void>((resolve) => {
      releaseReads = resolve
    })

    mocks.findForm.mockImplementation(async () => {
      findCalls += 1
      if (findCalls === 2) {
        releaseReads()
      }
      await bothReadsStarted
      return storedForm({ maxSubmissions: 1, _count: { responses: 0 } })
    })

    const [first, second] = await Promise.all([
      POST(requestFor({ email: 'first@example.com' }), { params }),
      POST(requestFor({ email: 'second@example.com' }), { params }),
    ])

    expect(
      [first.status, second.status].filter((status) => status === 201),
    ).toHaveLength(1)
    expect(mocks.createResponse).toHaveBeenCalledTimes(1)
  })
})
