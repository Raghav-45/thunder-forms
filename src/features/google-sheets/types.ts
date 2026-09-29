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
