import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteForm: vi.fn(),
  findForm: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { forms: { findUnique: mocks.findForm, delete: mocks.deleteForm } },
}))

vi.mock('next/headers', () => ({ headers: mocks.headers }))

import { DELETE } from '@/app/api/forms/[id]/delete/route'

const params = Promise.resolve({ id: 'form-1' })

describe('DELETE /api/forms/[id]/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.findForm.mockResolvedValue({ userId: 'user-1' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without an authenticated user', async () => {
    mocks.getSession.mockResolvedValue(null)

    const response = await DELETE(new Request('http://localhost'), { params })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.findForm).not.toHaveBeenCalled()
  })

  it('returns 404 when form does not exist', async () => {
    mocks.findForm.mockResolvedValue(null)

    const response = await DELETE(new Request('http://localhost'), { params })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Form not found' })
    expect(mocks.deleteForm).not.toHaveBeenCalled()
  })

  it('returns 403 when authenticated user does not own form', async () => {
    mocks.findForm.mockResolvedValue({ userId: 'other-user' })

    const response = await DELETE(new Request('http://localhost'), { params })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.deleteForm).not.toHaveBeenCalled()
  })

  it('deletes only form confirmed to belong to authenticated user', async () => {
    const response = await DELETE(new Request('http://localhost'), { params })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toBe('form-1')
    expect(mocks.deleteForm).toHaveBeenCalledWith({ where: { id: 'form-1' } })
  })

  it('returns 500 without exposing database errors outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mocks.deleteForm.mockRejectedValue(new Error('database unavailable'))

    const response = await DELETE(new Request('http://localhost'), { params })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Database error occurred',
    })
  })
})
