import { google } from 'googleapis'
import { randomBytes } from 'node:crypto'
import type { GoogleSheetsColumn } from '@/features/google-sheets/types'
import { decryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import { createGoogleSheetsOAuthClient } from './oauth'

export interface GoogleSpreadsheetTarget {
  spreadsheetId: string
  spreadsheetTitle: string
  spreadsheetUrl: string
  sheetId: number
  sheetTitle: string
}

function quoteSheetTitle(title: string): string {
  return `'${title.replaceAll("'", "''")}'`
}

export function createGoogleSheetsClient(encryptedRefreshToken: string) {
  const auth = createGoogleSheetsOAuthClient()
  auth.setCredentials({
    refresh_token: decryptGoogleOAuthSecret(encryptedRefreshToken),
  })

  return {
    auth,
    sheets: google.sheets({ version: 'v4', auth }),
  }
}

async function writeHeaders(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetTitle: string,
  headers: GoogleSheetsColumn[],
) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteSheetTitle(sheetTitle)}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers.map((header) => header.label)] },
  })
}

export async function createManagedSpreadsheet(
  encryptedRefreshToken: string,
  formTitle: string,
  headers: GoogleSheetsColumn[],
): Promise<GoogleSpreadsheetTarget> {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  const sheetTitle = 'Responses'
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `ThunderForms — ${formTitle.slice(0, 80)}` },
      sheets: [{ properties: { title: sheetTitle } }],
    },
  })
  const sheet = response.data.sheets?.[0]?.properties
  const spreadsheetId = response.data.spreadsheetId
  const spreadsheetUrl = response.data.spreadsheetUrl

  if (
    !spreadsheetId ||
    !spreadsheetUrl ||
    typeof sheet?.sheetId !== 'number' ||
    !sheet.title
  ) {
    throw new Error('Google did not return a complete spreadsheet target')
  }

  await writeHeaders(sheets, spreadsheetId, sheet.title, headers)

  return {
    spreadsheetId,
    spreadsheetTitle: response.data.properties?.title || formTitle,
    spreadsheetUrl,
    sheetId: sheet.sheetId,
    sheetTitle: sheet.title,
  }
}

export async function createManagedSheetInSpreadsheet(
  encryptedRefreshToken: string,
  spreadsheetId: string,
  formId: string,
  headers: GoogleSheetsColumn[],
): Promise<GoogleSpreadsheetTarget> {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'spreadsheetId,spreadsheetUrl,properties.title',
  })
  const sheetTitle = `ThunderForms responses ${formId.slice(-8)}-${randomBytes(3).toString('hex')}`
  const created = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetTitle } } }],
    },
  })
  const sheet = created.data.replies?.[0]?.addSheet?.properties

  if (!sheet || typeof sheet.sheetId !== 'number' || !sheet.title) {
    throw new Error('Google did not create a response sheet')
  }

  await writeHeaders(sheets, spreadsheetId, sheet.title, headers)

  return {
    spreadsheetId,
    spreadsheetTitle: metadata.data.properties?.title || 'Google Sheet',
    spreadsheetUrl:
      metadata.data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheetId: sheet.sheetId,
    sheetTitle: sheet.title,
  }
}

export async function deleteManagedSpreadsheet(
  encryptedRefreshToken: string,
  spreadsheetId: string,
) {
  const { auth } = createGoogleSheetsClient(encryptedRefreshToken)
  const drive = google.drive({ version: 'v3', auth })
  await drive.files.delete({ fileId: spreadsheetId })
}

export async function deleteManagedSheet(
  encryptedRefreshToken: string,
  spreadsheetId: string,
  sheetId: number,
) {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ deleteSheet: { sheetId } }] },
  })
}

export async function updateManagedSheetHeaders(
  encryptedRefreshToken: string,
  spreadsheetId: string,
  sheetId: number,
  headers: GoogleSheetsColumn[],
) {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  const sheetTitle = await getGoogleSheetsTabTitle(sheets, spreadsheetId, sheetId)
  await writeHeaders(sheets, spreadsheetId, sheetTitle, headers)
}

export async function getPickerAccessToken(
  encryptedRefreshToken: string,
): Promise<string> {
  const { auth } = createGoogleSheetsClient(encryptedRefreshToken)
  const { token } = await auth.getAccessToken()
  if (!token) throw new Error('Google did not provide an access token')
  return token
}

export async function appendGoogleSheetsRow(
  encryptedRefreshToken: string,
  spreadsheetId: string,
  sheetId: number,
  row: string[],
): Promise<string | null> {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  const sheetTitle = await getGoogleSheetsTabTitle(sheets, spreadsheetId, sheetId)

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${quoteSheetTitle(sheetTitle)}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  })

  return response.data.updates?.updatedRange || null
}

async function getGoogleSheetsTabTitle(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetId: number,
): Promise<string> {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title)',
  })
  const sheet = metadata.data.sheets?.find(
    (candidate) => candidate.properties?.sheetId === sheetId,
  )?.properties

  if (!sheet?.title) throw new Error('Google Sheets response tab no longer exists')

  return sheet.title
}

export async function hasGoogleSheetsSubmission(
  encryptedRefreshToken: string,
  spreadsheetId: string,
  sheetId: number,
  responseId: string,
): Promise<boolean> {
  const { sheets } = createGoogleSheetsClient(encryptedRefreshToken)
  const sheetTitle = await getGoogleSheetsTabTitle(sheets, spreadsheetId, sheetId)

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetTitle(sheetTitle)}!A2:A`,
  })

  return response.data.values?.some(([value]) => value === responseId) ?? false
}
