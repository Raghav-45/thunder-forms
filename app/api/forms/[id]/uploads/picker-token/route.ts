import { FileUploadConnectionStatus } from '@prisma/client'
import { getGoogleDriveAccessToken } from '@/features/file-uploads/server/google-drive'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadForm,
} from '@/features/file-uploads/server/owner'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const { userId } = await getOwnedFileUploadForm(formId)
    const connection = await prisma.file_upload_connections.findUnique({
      where: { userId },
    })
    if (connection?.status !== FileUploadConnectionStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Connect Google Drive before choosing a folder' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { accessToken: await getGoogleDriveAccessToken(connection.encryptedRefreshToken) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return fileUploadErrorResponse(error)
  }
}
