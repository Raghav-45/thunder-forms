import { FileUploadConnectionStatus, FileUploadStatus } from '@prisma/client'
import {
  getOrderedFormFields,
  isFormStructure,
} from '@/features/form-builder/form-structure'
import type { FileUploadConfig } from '@/features/form-builder/elements/fields/file-upload'
import { markGoogleDriveConnectionForReauthentication } from '@/features/file-uploads/server/google-drive'
import {
  createSizeLimitedFileStream,
  FileUploadContentError,
  FileUploadRequestError,
  FileUploadSizeLimitError,
  parseStreamedFileUpload,
  type StreamedFileUpload,
} from '@/features/file-uploads/server/multipart'
import { getFileStorageProvider } from '@/features/file-uploads/server/storage'
import {
  deleteExpiredFileUploadSessions,
  fileUploadSessionCookieName,
  getOrCreateFileUploadSession,
  FILE_UPLOAD_SESSION_MAX_AGE,
} from '@/features/file-uploads/server/session'
import {
  FILE_UPLOAD_MAX_SIZE_BYTES,
  normalizeFileUploadMaxFiles,
  normalizeFileUploadMaxSizeBytes,
} from '@/features/file-uploads/constants'
import { prisma } from '@/lib/prisma'
import { after, NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

class PublicFileUploadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const MAX_UPLOAD_RESERVATION_AGE_MS = 30 * 60 * 1000
const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3

function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2034'
  )
}

async function reserveFileUpload({
  formId,
  fieldId,
  sessionId,
  destinationId,
  fileName,
  mimeType,
  maxFiles,
}: {
  formId: string
  fieldId: string
  sessionId: string
  destinationId: string
  fileName: string
  mimeType: string
  maxFiles: number
}) {
  for (let attempt = 0; attempt < SERIALIZABLE_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          await transaction.file_uploads.deleteMany({
            where: {
              formId,
              fieldId,
              sessionId,
              status: FileUploadStatus.UPLOADING,
              createdAt: {
                lt: new Date(Date.now() - MAX_UPLOAD_RESERVATION_AGE_MS),
              },
            },
          })
          const occupiedSlots = await transaction.file_uploads.count({
            where: {
              formId,
              fieldId,
              sessionId,
              status: {
                in: [
                  FileUploadStatus.UPLOADING,
                  FileUploadStatus.PENDING,
                ],
              },
            },
          })
          if (occupiedSlots >= maxFiles) {
            throw new PublicFileUploadError(
              'This field already has its maximum number of uploaded files',
              422,
            )
          }

          return transaction.file_uploads.create({
            data: {
              formId,
              fieldId,
              sessionId,
              destinationId,
              storageKey: '',
              fileName,
              mimeType,
              sizeBytes: 0,
              status: FileUploadStatus.UPLOADING,
            },
          })
        },
        { isolationLevel: 'Serializable' },
      )
    } catch (error) {
      if (isSerializationFailure(error) && attempt + 1 < SERIALIZABLE_TRANSACTION_ATTEMPTS) {
        continue
      }
      throw error
    }
  }

  throw new Error('File upload reservation did not complete')
}

function acceptedByField(
  file: Pick<File, 'name' | 'type'>,
  acceptedTypes?: string,
): boolean {
  if (!acceptedTypes?.trim()) return true

  return acceptedTypes.split(',').some((rawType) => {
    const type = rawType.trim().toLowerCase()
    if (!type) return false
    if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1))
    if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type)
    return file.type.toLowerCase() === type
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let connectionId: string | null = null
  let incomingUpload: StreamedFileUpload | null = null
  let sizeLimit: number | null = null
  let reservedUploadId: string | null = null
  let uploadPersisted = false
  try {
    const { id: formId } = await params
    incomingUpload = await parseStreamedFileUpload(request, FILE_UPLOAD_MAX_SIZE_BYTES)
    const { fieldId, fileName, mimeType } = incomingUpload

    const form = await prisma.forms.findUnique({
      where: { id: formId },
      select: {
        fields: true,
        expiresAt: true,
        maxSubmissions: true,
        _count: { select: { responses: true } },
        fileUploadDestinations: {
          include: { connection: true },
        },
      },
    })
    if (!form) throw new PublicFileUploadError('Form not found', 404)
    if (!isFormStructure(form.fields)) {
      throw new PublicFileUploadError('Form structure is invalid', 422)
    }
    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new PublicFileUploadError('Form has expired', 410)
    }
    if (form.maxSubmissions && form._count.responses >= form.maxSubmissions) {
      throw new PublicFileUploadError('Form has reached maximum submissions limit', 410)
    }

    const field = getOrderedFormFields(form.fields).find(
      (candidate) => candidate.id === fieldId,
    )
    if (!field || field.uniqueIdentifier !== 'file-upload') {
      throw new PublicFileUploadError('File uploads are not enabled for this field', 422)
    }
    const uploadField = field as FileUploadConfig
    if (uploadField.disabled) {
      throw new PublicFileUploadError('File uploads are disabled for this field', 422)
    }
    sizeLimit = normalizeFileUploadMaxSizeBytes(uploadField)
    if (!acceptedByField({ name: fileName, type: mimeType }, uploadField.acceptedTypes)) {
      throw new PublicFileUploadError('This file type is not accepted', 422)
    }

    const destination = form.fileUploadDestinations.find(
      (candidate) => candidate.fieldId === fieldId,
    )
    if (
      !destination ||
      destination.connection.status !== FileUploadConnectionStatus.ACTIVE
    ) {
      throw new PublicFileUploadError('File uploads are not configured for this field', 409)
    }
    connectionId = destination.connection.id

    const { session, created } = await getOrCreateFileUploadSession(
      formId,
      request.cookies.get(fileUploadSessionCookieName(formId))?.value,
    )
    const maxFiles = normalizeFileUploadMaxFiles(uploadField)
    const reservedUpload = await reserveFileUpload({
      formId,
      fieldId,
      sessionId: session.id,
      destinationId: destination.id,
      fileName,
      mimeType,
      maxFiles,
    })
    reservedUploadId = reservedUpload.id

    const storageProvider = getFileStorageProvider(destination.provider)
    const limitedFile = createSizeLimitedFileStream(incomingUpload.stream, sizeLimit)
    let stored: { storageKey: string } | null = null

    try {
      stored = await storageProvider.upload({
        encryptedRefreshToken: destination.connection.encryptedRefreshToken,
        folderId: destination.folderId,
        fileName,
        mimeType,
        stream: limitedFile.stream,
      })
      await incomingUpload.completed
      if (
        incomingUpload.isTruncated() ||
        limitedFile.exceededLimit() ||
        limitedFile.getSizeBytes() === 0
      ) {
        throw new FileUploadSizeLimitError()
      }

      const finalized = await prisma.file_uploads.updateMany({
        where: {
          id: reservedUpload.id,
          status: FileUploadStatus.UPLOADING,
        },
        data: {
          storageKey: stored.storageKey,
          sizeBytes: limitedFile.getSizeBytes(),
          status: FileUploadStatus.PENDING,
        },
      })
      if (finalized.count !== 1) {
        throw new Error('File upload reservation expired before it could be saved')
      }
      uploadPersisted = true
      const response = NextResponse.json({
        upload: {
          id: reservedUpload.id,
          name: fileName,
          mimeType,
          sizeBytes: limitedFile.getSizeBytes(),
        },
      }, { status: 201 })
      if (created) {
        response.cookies.set(fileUploadSessionCookieName(formId), session.id, {
          httpOnly: true,
          maxAge: FILE_UPLOAD_SESSION_MAX_AGE,
          path: `/api/forms/${formId}`,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
      after(() => deleteExpiredFileUploadSessions().catch((cleanupError) => {
        console.error('Expired file upload cleanup failed:', cleanupError)
      }))
      return response
    } catch (error) {
      if (stored) {
        await storageProvider.delete({
          encryptedRefreshToken: destination.connection.encryptedRefreshToken,
          storageKey: stored.storageKey,
        }).catch((cleanupError) => {
          console.error('Failed to remove orphaned Google Drive file:', cleanupError)
        })
      }
      throw error
    }
  } catch (error) {
    incomingUpload?.abort()
    await incomingUpload?.completed.catch(() => undefined)
    if (reservedUploadId && !uploadPersisted) {
      await prisma.file_uploads.deleteMany({
        where: {
          id: reservedUploadId,
          status: FileUploadStatus.UPLOADING,
        },
      }).catch((cleanupError) => {
        console.error('Failed to release file upload reservation:', cleanupError)
      })
    }
    if (error instanceof PublicFileUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof FileUploadRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof FileUploadSizeLimitError) {
      return NextResponse.json(
        {
          error: `Files must be between 1 byte and ${Math.ceil((sizeLimit || FILE_UPLOAD_MAX_SIZE_BYTES) / (1024 * 1024))} MB`,
        },
        { status: 422 },
      )
    }
    if (error instanceof FileUploadContentError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    await markGoogleDriveConnectionForReauthentication(connectionId, error)
    console.error('Public file upload failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    )
  }
}
