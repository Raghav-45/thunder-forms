export const GOOGLE_SHEETS_SCOPE =
  'https://www.googleapis.com/auth/drive.file'

export const GOOGLE_SHEETS_FIXED_COLUMNS = [
  { key: '__response_id', label: 'Submission ID' },
  { key: '__submitted_at', label: 'Submitted At' },
] as const

export interface GoogleSheetsColumn {
  key: string
  label: string
}

export interface GoogleSheetsIntegrationSummary {
  status: 'ACTIVE' | 'PAUSED'
  spreadsheetTitle: string
  spreadsheetUrl: string
  sheetTitle: string
  lastSyncedAt: string | null
  lastError: string | null
  pendingCount: number
  failedCount: number
}
