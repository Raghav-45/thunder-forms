import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { forms: { create: mocks.create } },
}))

vi.mock('next/headers', () => ({ headers: mocks.headers }))

import { POST } from '@/app/api/forms/new/route'

const fields = {
  pages: [
    {
      id: 'page-1',
      sections: [
        {
          id: 'section-1',
          title: 'Contact details',
          description: 'How we can reach you.',
          fields: [
            {
              id: 'email',
              label: 'Email',
              uniqueIdentifier: 'text-input',
              inputType: 'email',
            },
          ],
        },
      ],
    },
  ],
}

const payload = { title: 'Contact form', fields }

const requestFor = (body: unknown) =>
  new Request('http://localhost/api/forms/new', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

describe('POST /api/forms/new', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.create.mockResolvedValue({ id: 'form-1' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without an authenticated user', async () => {
    mocks.getSession.mockResolvedValue(null)

    const response = await POST(requestFor(payload))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('returns field-level validation errors for an invalid payload', async () => {
    const response = await POST(requestFor({ ...payload, title: 'A' }))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Validation error',
      issues: [expect.objectContaining({ field: 'title', message: 'Title is required' })],
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('returns 422 when fields are not canonical form structure', async () => {
    const response = await POST(requestFor({ ...payload, fields: { pages: [] } }))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid form structure',
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('persists form under authenticated user with validated payload', async () => {
    const response = await POST(
      requestFor({
        ...payload,
        description: 'A contact form',
        maxSubmissions: 10,
        redirectUrl: 'https://example.com/thanks',
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ success: true, id: 'form-1' })
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        title: 'Contact form',
        fields,
        maxSubmissions: 10,
        redirectUrl: 'https://example.com/thanks',
      }),
    })
  })

  it('returns 500 without exposing database errors outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mocks.create.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(requestFor(payload))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Internal server error',
    })
  })
})
