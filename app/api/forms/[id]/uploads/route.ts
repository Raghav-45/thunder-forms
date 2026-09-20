import { FileUploadConnectionStatus, FileUploadStatus } from '@prisma/client'
import {
  getOrderedFormFields,
  isFormStructure,
} from '@/features/form-builder/form-structure'
import type { FileUploadConfig } from '@/features/form-builder/elements/fields/file-upload'
import { markGoogleDriveConnectionForReauthentication } from '@/features/file-uploads/server/google-drive'
import {
  createSizeLimitedFileStream,
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
        fileUploadDestination: {
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

    const destination = form.fileUploadDestination
    if (
      !destination ||
      destination.connection.status !== FileUploadConnectionStatus.ACTIVE
    ) {
      throw new PublicFileUploadError('File uploads are not configured for this form', 409)
    }
    connectionId = destination.connection.id

    const { session, created } = await getOrCreateFileUploadSession(
      formId,
      request.cookies.get(fileUploadSessionCookieName(formId))?.value,
    )
    const pendingCount = await prisma.file_uploads.count({
      where: {
        formId,
        fieldId,
        sessionId: session.id,
        status: FileUploadStatus.PENDING,
      },
    })
    const maxFiles = normalizeFileUploadMaxFiles(uploadField)
    if (pendingCount >= maxFiles) {
      throw new PublicFileUploadError(
        'This field already has its maximum number of uploaded files',
        422,
      )
    }

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

      const upload = await prisma.file_uploads.create({
        data: {
          formId,
          fieldId,
          sessionId: session.id,
          destinationId: destination.id,
          storageKey: stored.storageKey,
          fileName,
          mimeType,
          sizeBytes: limitedFile.getSizeBytes(),
        },
      })
      const response = NextResponse.json({
        upload: {
          id: upload.id,
          name: upload.fileName,
          mimeType: upload.mimeType,
          sizeBytes: upload.sizeBytes,
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
