import { FileUploadConnectionStatus } from '@prisma/client'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadField,
} from '@/features/file-uploads/server/owner'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> },
) {
  try {
    const { id: formId, fieldId } = await params
    const { userId } = await getOwnedFileUploadField(formId, fieldId)
    const [connection, destination] = await Promise.all([
      prisma.file_upload_connections.findUnique({ where: { userId } }),
      prisma.file_upload_destinations.findUnique({
        where: { formId_fieldId: { formId, fieldId } },
      }),
    ])

    return NextResponse.json({
      connection: connection ? { status: connection.status } : null,
      destination: destination ? { folderName: destination.folderName } : null,
      ready:
        connection?.status === FileUploadConnectionStatus.ACTIVE &&
        Boolean(destination),
    })
  } catch (error) {
    return fileUploadErrorResponse(error)
  }
}
