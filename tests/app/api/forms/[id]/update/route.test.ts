import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findForm: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { forms: { findUnique: mocks.findForm, update: mocks.update } },
}))

vi.mock('next/headers', () => ({ headers: mocks.headers }))

import { POST } from '@/app/api/forms/[id]/update/route'

const fields = {
  pages: [
    {
      id: 'page-1',
      sections: [
        {
          id: 'section-1',
          title: 'Your details',
          description: 'Tell us about yourself.',
          fields: [
            { id: 'name', label: 'Name', uniqueIdentifier: 'text-input' },
          ],
        },
      ],
    },
  ],
}

const payload = { title: 'Updated form', fields }

const requestFor = (body: unknown) =>
  new Request('http://localhost/api/forms/form-1/update', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

const params = Promise.resolve({ id: 'form-1' })

describe('POST /api/forms/[id]/update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.findForm.mockResolvedValue({ id: 'form-1', userId: 'user-1' })
    mocks.update.mockResolvedValue({ id: 'form-1', ...payload })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without an authenticated user', async () => {
    mocks.getSession.mockResolvedValue(null)

    const response = await POST(requestFor(payload), { params })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.findForm).not.toHaveBeenCalled()
  })

  it('returns 422 before loading a form for invalid payload data', async () => {
    const response = await POST(requestFor({ ...payload, fields: { pages: [] } }), {
      params,
    })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid form structure',
    })
    expect(mocks.findForm).not.toHaveBeenCalled()
  })

  it('returns 404 when form does not exist', async () => {
    mocks.findForm.mockResolvedValue(null)

    const response = await POST(requestFor(payload), { params })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Form not found' })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('returns 403 when authenticated user does not own form', async () => {
    mocks.findForm.mockResolvedValue({ id: 'form-1', userId: 'other-user' })

    const response = await POST(requestFor(payload), { params })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('updates only the requested form after ownership validation', async () => {
    const response = await POST(
      requestFor({ ...payload, maxSubmissions: 5, redirectUrl: null }),
      { params },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'form-1', ...payload })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'form-1' },
      data: expect.objectContaining({
        title: 'Updated form',
        fields,
        maxSubmissions: 5,
        redirectUrl: null,
      }),
    })
  })
})
