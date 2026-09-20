import { FileUploadConnectionStatus } from '@prisma/client'
import { getGoogleDriveFolder } from '@/features/file-uploads/server/google-drive'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadForm,
} from '@/features/file-uploads/server/owner'
import { GOOGLE_DRIVE_STORAGE_PROVIDER } from '@/features/file-uploads/types'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const body = await request.json()
    const folderId = body?.folderId
    if (typeof folderId !== 'string' || !folderId) {
      return NextResponse.json({ error: 'Google Drive folder is required' }, { status: 400 })
    }

    const { userId } = await getOwnedFileUploadForm(formId)
    const connection = await prisma.file_upload_connections.findUnique({
      where: { userId },
    })
    if (connection?.status !== FileUploadConnectionStatus.ACTIVE) {
      return NextResponse.json({ error: 'Connect Google Drive before choosing a folder' }, { status: 409 })
    }

    const folder = await getGoogleDriveFolder(
      connection.encryptedRefreshToken,
      folderId,
    )
    const destination = await prisma.file_upload_destinations.upsert({
      where: { formId },
      update: {
        connectionId: connection.id,
        provider: GOOGLE_DRIVE_STORAGE_PROVIDER,
        folderId: folder.folderId,
        folderName: folder.folderName,
      },
      create: {
        formId,
        connectionId: connection.id,
        provider: GOOGLE_DRIVE_STORAGE_PROVIDER,
        folderId: folder.folderId,
        folderName: folder.folderName,
      },
    })
    return NextResponse.json({ folderName: destination.folderName })
  } catch (error) {
    return fileUploadErrorResponse(error)
  }
}
