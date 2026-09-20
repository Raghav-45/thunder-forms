import { randomUUID } from 'node:crypto'
import { getGoogleSheetsSyncSecret } from '@/features/google-sheets/server/config'
import { drainGoogleSheetsDeliveries } from '@/features/google-sheets/server/deliveries'
import { GOOGLE_SHEETS_SYNC_BATCH_LIMIT } from '@/features/google-sheets/constants'
import { NextRequest, NextResponse } from 'next/server'

function isAuthorized(request: NextRequest): boolean {
  try {
    return request.headers.get('authorization') === `Bearer ${getGoogleSheetsSyncSecret()}`
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit =
      typeof body.limit === 'number'
        ? Math.max(1, Math.min(Math.floor(body.limit), GOOGLE_SHEETS_SYNC_BATCH_LIMIT))
        : GOOGLE_SHEETS_SYNC_BATCH_LIMIT
    const claimed = await drainGoogleSheetsDeliveries(randomUUID(), limit)
    return NextResponse.json({ claimed })
  } catch (error) {
    console.error('Google Sheets sync worker failed:', error)
    return NextResponse.json({ error: 'Google Sheets sync failed' }, { status: 500 })
  }
}
