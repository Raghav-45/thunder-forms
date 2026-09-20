import { Readable } from 'node:stream'
import { getFileStorageProvider } from '@/features/file-uploads/server/storage'
import { markGoogleDriveConnectionForReauthentication } from '@/features/file-uploads/server/google-drive'
import {
  fileUploadErrorResponse,
  getOwnedFileUploadForm,
} from '@/features/file-uploads/server/owner'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function contentDisposition(fileName: string) {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, '_').replaceAll('"', '')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; uploadId: string }> },
) {
  let connectionId: string | null = null
  try {
    const { id: formId, uploadId } = await params
    await getOwnedFileUploadForm(formId)
    const upload = await prisma.file_uploads.findFirst({
      where: { id: uploadId, formId, status: 'ATTACHED' },
      include: { destination: { include: { connection: true } } },
    })
    if (!upload) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    connectionId = upload.destination.connection.id

    const stream = await getFileStorageProvider(upload.destination.provider).download({
      encryptedRefreshToken: upload.destination.connection.encryptedRefreshToken,
      storageKey: upload.storageKey,
    })
    return new NextResponse(
      Readable.toWeb(stream as Readable) as unknown as ReadableStream<Uint8Array>,
      {
      headers: {
        'Content-Type': upload.mimeType,
        'Content-Disposition': contentDisposition(upload.fileName),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
      },
    )
  } catch (error) {
    await markGoogleDriveConnectionForReauthentication(connectionId, error)
    return fileUploadErrorResponse(error)
  }
}
