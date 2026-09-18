export interface GoogleSheetsConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  return {
    clientId: required('GOOGLE_SHEETS_OAUTH_CLIENT_ID'),
    clientSecret: required('GOOGLE_SHEETS_OAUTH_CLIENT_SECRET'),
    redirectUri: required('GOOGLE_SHEETS_OAUTH_REDIRECT_URI'),
  }
}

export function getGoogleSheetsSyncSecret(): string {
  return required('GOOGLE_SHEETS_SYNC_SECRET')
}
