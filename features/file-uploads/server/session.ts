import { randomUUID } from 'node:crypto'
import { FileUploadStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { GOOGLE_DRIVE_STORAGE_PROVIDER } from '../types'
import { googleDriveStorageProvider } from './storage'

const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000

export function fileUploadSessionCookieName(formId: string) {
  return `file-upload-session-${formId}`
}

export async function getOrCreateFileUploadSession(
  formId: string,
  sessionId?: string,
) {
  if (sessionId) {
    const existing = await prisma.file_upload_sessions.findFirst({
      where: { id: sessionId, formId, expiresAt: { gt: new Date() } },
    })
    if (existing) return { session: existing, created: false }
  }

  const session = await prisma.file_upload_sessions.create({
    data: {
      id: randomUUID(),
      formId,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
    },
  })
  return { session, created: true }
}

export async function deleteExpiredFileUploadSessions() {
  const sessions = await prisma.file_upload_sessions.findMany({
    where: { expiresAt: { lte: new Date() } },
    include: {
      uploads: {
        where: { status: FileUploadStatus.PENDING },
        include: { destination: { include: { connection: true } } },
      },
    },
    take: 25,
  })

  for (const session of sessions) {
    let deletionFailed = false
    for (const upload of session.uploads) {
      if (upload.destination.provider !== GOOGLE_DRIVE_STORAGE_PROVIDER) {
        deletionFailed = true
        continue
      }
      try {
        await googleDriveStorageProvider.delete({
          encryptedRefreshToken: upload.destination.connection.encryptedRefreshToken,
          storageKey: upload.storageKey,
        })
      } catch (error) {
        console.error('Failed to remove expired Google Drive upload:', error)
        deletionFailed = true
        continue
      }
    }

    if (!deletionFailed) {
      await prisma.file_upload_sessions.delete({ where: { id: session.id } })
    }
  }
}

export const FILE_UPLOAD_SESSION_MAX_AGE = SESSION_LIFETIME_MS / 1000
