import { FileUploadConnectionStatus, FileUploadStatus } from '@prisma/client'
import {
  getOrderedFormFields,
  isFormStructure,
} from '@/features/form-builder/form-structure'
import type { FileUploadConfig } from '@/features/form-builder/elements/fields/file-upload'
import { isGoogleDriveAuthorizationError } from '@/features/file-uploads/server/google-drive'
import { getFileStorageProvider } from '@/features/file-uploads/server/storage'
import {
  deleteExpiredFileUploadSessions,
  fileUploadSessionCookieName,
  getOrCreateFileUploadSession,
  FILE_UPLOAD_SESSION_MAX_AGE,
} from '@/features/file-uploads/server/session'
import { prisma } from '@/lib/prisma'
import { after, NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function acceptedByField(file: File, acceptedTypes?: string): boolean {
  if (!acceptedTypes?.trim()) return true

  return acceptedTypes.split(',').some((rawType) => {
    const type = rawType.trim().toLowerCase()
    if (!type) return false
    if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1))
    if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type)
    return file.type.toLowerCase() === type
  })
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'size' in value &&
    typeof value.size === 'number'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let connectionId: string | null = null
  try {
    const { id: formId } = await params
    const body = await request.formData()
    const fieldId = body.get('fieldId')
    const file = body.get('file')
    if (typeof fieldId !== 'string' || !fieldId || !isUploadedFile(file)) {
      return NextResponse.json(
        { error: 'A field and file are required' },
        { status: 400 },
      )
    }

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
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    if (!isFormStructure(form.fields)) {
      return NextResponse.json({ error: 'Form structure is invalid' }, { status: 422 })
    }
    if (form.expiresAt && form.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Form has expired' }, { status: 410 })
    }
    if (form.maxSubmissions && form._count.responses >= form.maxSubmissions) {
      return NextResponse.json({ error: 'Form has reached maximum submissions limit' }, { status: 410 })
    }

    const field = getOrderedFormFields(form.fields).find(
      (candidate) => candidate.id === fieldId,
    )
    if (!field || field.uniqueIdentifier !== 'file-upload') {
      return NextResponse.json({ error: 'File uploads are not enabled for this field' }, { status: 422 })
    }
    const uploadField = field as FileUploadConfig
    if (uploadField.disabled) {
      return NextResponse.json({ error: 'File uploads are disabled for this field' }, { status: 422 })
    }
    const sizeLimit = Math.min(
      Math.max(uploadField.maxSizeBytes ?? 4 * 1024 * 1024, 1),
      4 * 1024 * 1024,
    )
    if (file.size === 0 || file.size > sizeLimit) {
      return NextResponse.json(
        { error: `Files must be between 1 byte and ${Math.ceil(sizeLimit / (1024 * 1024))} MB` },
        { status: 422 },
      )
    }
    if (!acceptedByField(file, uploadField.acceptedTypes)) {
      return NextResponse.json({ error: 'This file type is not accepted' }, { status: 422 })
    }

    const destination = form.fileUploadDestination
    if (
      !destination ||
      destination.connection.status !== FileUploadConnectionStatus.ACTIVE
    ) {
      return NextResponse.json(
        { error: 'File uploads are not configured for this form' },
        { status: 409 },
      )
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
    const maxFiles = Math.min(Math.max(uploadField.maxFiles ?? 1, 1), 10)
    if (pendingCount >= maxFiles) {
      return NextResponse.json(
        { error: 'This field already has its maximum number of uploaded files' },
        { status: 422 },
      )
    }

    const storageProvider = getFileStorageProvider(destination.provider)
    const stored = await storageProvider.upload({
      encryptedRefreshToken: destination.connection.encryptedRefreshToken,
      folderId: destination.folderId,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      bytes: Buffer.from(await file.arrayBuffer()),
    })

    try {
      const upload = await prisma.file_uploads.create({
        data: {
          formId,
          fieldId,
          sessionId: session.id,
          destinationId: destination.id,
          storageKey: stored.storageKey,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
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
      await storageProvider.delete({
        encryptedRefreshToken: destination.connection.encryptedRefreshToken,
        storageKey: stored.storageKey,
      }).catch((cleanupError) => {
        console.error('Failed to remove orphaned Google Drive file:', cleanupError)
      })
      throw error
    }
  } catch (error) {
    if (connectionId && isGoogleDriveAuthorizationError(error)) {
      await prisma.file_upload_connections.update({
        where: { id: connectionId },
        data: { status: 'REAUTH_REQUIRED' },
      }).catch((updateError) => {
        console.error('Failed to mark Google Drive connection for reauthentication:', updateError)
      })
    }
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
