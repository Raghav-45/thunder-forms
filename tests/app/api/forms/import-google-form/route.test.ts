import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  getAccessToken: vi.fn(),
  listGoogleForms: vi.fn(),
  importGoogleForm: vi.fn(),
  consumeSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock('next/headers', () => ({ headers: mocks.headers }))

vi.mock('@/features/google-forms-import/server/forms', () => ({
  listGoogleForms: mocks.listGoogleForms,
  importGoogleForm: mocks.importGoogleForm,
}))

vi.mock('@/features/google-forms-import/server/session', () => ({
  GOOGLE_FORMS_IMPORT_SESSION_COOKIE: 'thunderforms_google_forms_import',
  googleFormsImportCookieOptions: () => ({ path: '/' }),
  getGoogleFormsImportAccessToken: mocks.getAccessToken,
  consumeGoogleFormsImportSession: mocks.consumeSession,
}))

import { GET, POST } from '@/app/api/forms/import-google-form/route'

function request(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(url, init)
}

describe('Google Forms import API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.getAccessToken.mockResolvedValue('temporary-access-token')
  })

  it('lists forms using only the temporary import authorization', async () => {
    mocks.listGoogleForms.mockResolvedValue({
      forms: [{ id: 'form-1', title: 'Customer survey', modifiedTime: null, ownedByMe: true }],
      nextPageToken: 'next-page',
    })

    const response = await GET(request('http://localhost/api/forms/import-google-form'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      forms: [{ id: 'form-1', title: 'Customer survey', modifiedTime: null, ownedByMe: true }],
      nextPageToken: 'next-page',
    })
    expect(mocks.listGoogleForms).toHaveBeenCalledWith(
      'temporary-access-token',
      undefined,
    )
  })

  it('imports the selected form then consumes the temporary authorization', async () => {
    mocks.importGoogleForm.mockResolvedValue({
      title: 'Customer survey',
      description: '',
      fields: [],
      skippedItems: [],
    })
    const importRequest = request('http://localhost/api/forms/import-google-form', {
      method: 'POST',
      body: JSON.stringify({ formId: 'form_ABC-123' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(importRequest)

    expect(response.status).toBe(200)
    expect(mocks.importGoogleForm).toHaveBeenCalledWith(
      'temporary-access-token',
      'form_ABC-123',
    )
    expect(mocks.consumeSession).toHaveBeenCalledWith(importRequest, 'user-1')
  })

  it('rejects an import without a temporary Google authorization', async () => {
    mocks.getAccessToken.mockResolvedValue(null)

    const response = await POST(
      request('http://localhost/api/forms/import-google-form', {
        method: 'POST',
        body: JSON.stringify({ formId: 'form-1' }),
        headers: { 'content-type': 'application/json' },
      }),
    )

    expect(response.status).toBe(401)
    expect(mocks.importGoogleForm).not.toHaveBeenCalled()
  })
})
