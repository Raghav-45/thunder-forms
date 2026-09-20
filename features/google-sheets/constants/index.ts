export const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const GOOGLE_SHEETS_OAUTH_RESULT_QUERY_PARAM = 'googleSheets'
export const GOOGLE_SHEETS_SYNC_BATCH_LIMIT = 25

export const GOOGLE_SHEETS_FIXED_COLUMNS = [
  { key: '__response_id', label: 'Submission ID' },
  { key: '__submitted_at', label: 'Submitted At' },
] as const
