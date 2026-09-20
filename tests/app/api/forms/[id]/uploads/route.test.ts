import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createUpload: vi.fn(),
  countUploads: vi.fn(),
  deleteUpload: vi.fn(),
  deleteExpiredUploads: vi.fn(),
  findForm: vi.fn(),
  getUploadSession: vi.fn(),
  providerUpload: vi.fn(),
  providerDelete: vi.fn(),
  transaction: vi.fn(),
  updateUpload: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const original = await importOriginal<typeof import('next/server')>()
  return { ...original, after: mocks.after }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    forms: { findUnique: mocks.findForm },
    file_uploads: {
      deleteMany: mocks.deleteUpload,
      updateMany: mocks.updateUpload,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/features/file-uploads/server/session', () => ({
  deleteExpiredFileUploadSessions: mocks.deleteExpiredUploads,
  fileUploadSessionCookieName: (formId: string) => `file-upload-session-${formId}`,
  getOrCreateFileUploadSession: mocks.getUploadSession,
  FILE_UPLOAD_SESSION_MAX_AGE: 7200,
}))

vi.mock('@/features/file-uploads/server/storage', () => ({
  getFileStorageProvider: () => ({
    upload: mocks.providerUpload,
    delete: mocks.providerDelete,
  }),
  googleDriveStorageProvider: {
    upload: mocks.providerUpload,
    delete: mocks.providerDelete,
  },
}))

import { POST } from '@/app/api/forms/[id]/uploads/route'

const fields = {
  pages: [{
    id: 'page-1',
    sections: [{
      id: 'section-1',
      fields: [{
        id: 'portfolio',
        label: 'Portfolio',
        uniqueIdentifier: 'file-upload',
        acceptedTypes: '.pdf',
        maxFiles: 1,
        maxSizeBytes: 5 * 1024 * 1024,
      }],
    }],
  }],
}

const form = (overrides: Record<string, unknown> = {}) => ({
  fields,
  expiresAt: null,
  maxSubmissions: null,
  _count: { responses: 0 },
  fileUploadDestinations: [{
    id: 'destination-1',
    fieldId: 'portfolio',
    provider: 'google-drive',
    folderId: 'folder-1',
    connection: {
      status: 'ACTIVE',
      encryptedRefreshToken: 'encrypted-token',
    },
  }],
  ...overrides,
})

const requestFor = (fieldId: string, file: File) => {
  const body = new FormData()
  body.set('fieldId', fieldId)
  body.set('file', file)
  return new NextRequest('http://localhost/api/forms/form-1/uploads', {
    method: 'POST',
    body,
  })
}

const params = Promise.resolve({ id: 'form-1' })

describe('POST /api/forms/[id]/uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findForm.mockResolvedValue(form())
    mocks.getUploadSession.mockResolvedValue({
      session: { id: 'session-1' },
      created: true,
    })
    mocks.countUploads.mockResolvedValue(0)
    mocks.deleteUpload.mockResolvedValue({ count: 1 })
    mocks.updateUpload.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        file_uploads: {
          create: mocks.createUpload,
          count: mocks.countUploads,
          deleteMany: mocks.deleteUpload,
        },
      }),
    )
    mocks.providerUpload.mockImplementation(async ({ stream }) => {
      await new Promise<void>((resolve, reject) => {
        stream.once('end', resolve)
        stream.once('error', reject)
        stream.resume()
      })
      return { storageKey: 'drive-file-1' }
    })
    mocks.createUpload.mockResolvedValue({
      id: 'upload-1',
    })
  })

  it('stores a valid public file in creator-owned Drive storage', async () => {
    const response = await POST(
      requestFor('portfolio', new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(201)
    expect(response.headers.get('set-cookie')).toContain('file-upload-session-form-1=session-1')
    await expect(response.json()).resolves.toEqual({
      upload: {
        id: 'upload-1',
        name: 'portfolio.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 3,
      },
    })
    expect(mocks.providerUpload).toHaveBeenCalledWith(expect.objectContaining({
      folderId: 'folder-1',
      fileName: 'portfolio.pdf',
      mimeType: 'application/pdf',
    }))
    const [uploadInput] = mocks.providerUpload.mock.calls[0]
    expect(uploadInput.stream).toEqual(expect.objectContaining({ pipe: expect.any(Function) }))
    expect(uploadInput).not.toHaveProperty('bytes')
    expect(mocks.createUpload).toHaveBeenCalledWith({
      data: expect.objectContaining({
        formId: 'form-1',
        fieldId: 'portfolio',
        sessionId: 'session-1',
        destinationId: 'destination-1',
        storageKey: '',
        sizeBytes: 0,
        status: 'UPLOADING',
      }),
    })
    expect(mocks.updateUpload).toHaveBeenCalledWith({
      where: { id: 'upload-1', status: 'UPLOADING' },
      data: expect.objectContaining({
        storageKey: 'drive-file-1',
        status: 'PENDING',
      }),
    })
  })

  it('rejects a file for a non-upload field before reaching Drive', async () => {
    const response = await POST(
      requestFor('unknown', new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(422)
    expect(mocks.providerUpload).not.toHaveBeenCalled()
  })

  it('requires a destination configured for the submitted upload field', async () => {
    mocks.findForm.mockResolvedValue(form({ fileUploadDestinations: [] }))

    const response = await POST(
      requestFor('portfolio', new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'File uploads are not configured for this field',
    })
    expect(mocks.providerUpload).not.toHaveBeenCalled()
  })

  it('rejects file types blocked by field configuration before reaching Drive', async () => {
    const response = await POST(
      requestFor('portfolio', new File(['text'], 'notes.txt', { type: 'text/plain' })),
      { params },
    )

    expect(response.status).toBe(422)
    expect(mocks.providerUpload).not.toHaveBeenCalled()
  })

  it('enforces the configured per-session file limit before reaching Drive', async () => {
    mocks.countUploads.mockResolvedValue(1)

    const response = await POST(
      requestFor('portfolio', new File(['pdf'], 'second.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(422)
    expect(mocks.providerUpload).not.toHaveBeenCalled()
  })

  it('reserves a slot only for the current respondent session', async () => {
    mocks.getUploadSession.mockResolvedValue({
      session: { id: 'session-2' },
      created: false,
    })

    const response = await POST(
      requestFor('portfolio', new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(201)
    expect(mocks.countUploads).toHaveBeenCalledWith({
      where: {
        formId: 'form-1',
        fieldId: 'portfolio',
        sessionId: 'session-2',
        status: { in: ['UPLOADING', 'PENDING'] },
      },
    })
  })

  it('removes Drive file and releases its reservation when finalization fails', async () => {
    mocks.updateUpload.mockRejectedValueOnce(new Error('Database unavailable'))

    const response = await POST(
      requestFor('portfolio', new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' })),
      { params },
    )

    expect(response.status).toBe(500)
    expect(mocks.providerDelete).toHaveBeenCalledWith({
      encryptedRefreshToken: 'encrypted-token',
      storageKey: 'drive-file-1',
    })
  })

  it('rejects an oversized stream and releases its reservation', async () => {
    const oversizedFile = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'portfolio.pdf',
      { type: 'application/pdf' },
    )

    const response = await POST(requestFor('portfolio', oversizedFile), { params })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      error: 'Files must be between 1 byte and 5 MB',
    })
    expect(mocks.updateUpload).not.toHaveBeenCalled()
    expect(mocks.deleteUpload).toHaveBeenCalledWith({
      where: { id: 'upload-1', status: 'UPLOADING' },
    })
  })

  it('rejects executable content even when its name and declared type are accepted', async () => {
    const response = await POST(
      requestFor(
        'portfolio',
        new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], 'portfolio.pdf', {
          type: 'application/pdf',
        }),
      ),
      { params },
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      error: 'Executable file content is not allowed',
    })
    expect(mocks.deleteUpload).toHaveBeenCalledWith({
      where: { id: 'upload-1', status: 'UPLOADING' },
    })
  })
})
