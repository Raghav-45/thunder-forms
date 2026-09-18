import { GoogleSheetsConnectionStatus } from '@prisma/client'
import { getPickerAccessToken } from '@/features/google-sheets/server/sheets'
import {
  getOwnedGoogleSheetsForm,
  googleSheetsErrorResponse,
} from '@/features/google-sheets/server/owner'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const { userId } = await getOwnedGoogleSheetsForm(formId)
    const connection = await prisma.google_sheets_connections.findUnique({
      where: { userId },
    })
    if (connection?.status !== GoogleSheetsConnectionStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Connect Google before choosing a spreadsheet' },
        { status: 409 },
      )
    }

    const accessToken = await getPickerAccessToken(
      connection.encryptedRefreshToken,
    )
    return NextResponse.json(
      { accessToken },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return googleSheetsErrorResponse(error)
  }
}
