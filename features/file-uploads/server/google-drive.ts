import { createHash, randomBytes } from 'node:crypto'
import { Readable } from 'node:stream'
import { CodeChallengeMethod } from 'google-auth-library'
import { google } from 'googleapis'
import { decryptGoogleOAuthSecret } from '@/features/google-auth/server/crypto'
import { GOOGLE_DRIVE_FILE_SCOPE } from '@/features/file-uploads/constants'
import { prisma } from '@/lib/prisma'

export function isGoogleDriveAuthorizationError(error: unknown) {
  if (error instanceof Error && error.message === 'invalid_grant') return true
  if (!error || typeof error !== 'object') return false
  const candidate = error as {
    code?: unknown
    response?: { status?: unknown; data?: { error?: unknown } }
  }
  return (
    candidate.code === 401 ||
    candidate.response?.status === 401 ||
    candidate.response?.data?.error === 'invalid_grant'
  )
}

interface GoogleDriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function fileUploadCredential(name: 'CLIENT_ID' | 'CLIENT_SECRET'): string {
  return (
    process.env[`GOOGLE_FILE_UPLOADS_OAUTH_${name}`] ||
    required(`GOOGLE_SHEETS_OAUTH_${name}`)
  )
}

function getGoogleDriveConfig(): GoogleDriveConfig {
  return {
    clientId: fileUploadCredential('CLIENT_ID'),
    clientSecret: fileUploadCredential('CLIENT_SECRET'),
    redirectUri: required('GOOGLE_FILE_UPLOADS_OAUTH_REDIRECT_URI'),
  }
}

export function createGoogleDriveOAuthClient() {
  const config = getGoogleDriveConfig()
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  )
}

export function createGoogleDriveAuthorizationValues() {
  const state = randomBytes(32).toString('base64url')
  const codeVerifier = randomBytes(64).toString('base64url')
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { state, codeVerifier, codeChallenge }
}

export function createGoogleDriveAuthorizationUrl(
  state: string,
  codeChallenge: string,
) {
  return createGoogleDriveOAuthClient().generateAuthUrl({
    access_type: 'offline',
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    include_granted_scopes: true,
    prompt: 'consent select_account',
    scope: [GOOGLE_DRIVE_FILE_SCOPE],
    state,
  })
}

function createGoogleDriveOAuthClientWithRefreshToken(encryptedRefreshToken: string) {
  const auth = createGoogleDriveOAuthClient()
  auth.setCredentials({
    refresh_token: decryptGoogleOAuthSecret(encryptedRefreshToken),
  })

  return auth
}

function createGoogleDriveClient(encryptedRefreshToken: string) {
  const auth = createGoogleDriveOAuthClientWithRefreshToken(encryptedRefreshToken)
  return google.drive({ version: 'v3', auth })
}

export async function getGoogleDriveAccessToken(
  encryptedRefreshToken: string,
) {
  const auth = createGoogleDriveOAuthClientWithRefreshToken(encryptedRefreshToken)
  const { token } = await auth.getAccessToken()
  if (!token) throw new Error('Google did not provide an access token')
  return token
}

export async function markGoogleDriveConnectionForReauthentication(
  connectionId: string | null,
  error: unknown,
) {
  if (!connectionId || !isGoogleDriveAuthorizationError(error)) return

  await prisma.file_upload_connections.update({
    where: { id: connectionId },
    data: { status: 'REAUTH_REQUIRED' },
  }).catch((updateError) => {
    console.error('Failed to mark Google Drive connection for reauthentication:', updateError)
  })
}

export async function getGoogleDriveFolder(
  encryptedRefreshToken: string,
  folderId: string,
) {
  const drive = createGoogleDriveClient(encryptedRefreshToken)
  const response = await drive.files.get({
    fileId: folderId,
    fields: 'id,name,mimeType,trashed,permissions(type)',
  })
  if (
    response.data.mimeType !== 'application/vnd.google-apps.folder' ||
    response.data.trashed ||
    !response.data.id ||
    !response.data.name
  ) {
    throw new Error('Selected Google Drive item is not an active folder')
  }
  if (
    response.data.permissions?.some(
      (permission) => permission.type === 'anyone' || permission.type === 'domain',
    )
  ) {
    throw new Error('Choose a Google Drive folder that is not shared publicly or with a domain')
  }
  return { folderId: response.data.id, folderName: response.data.name }
}

export async function uploadGoogleDriveFile({
  encryptedRefreshToken,
  folderId,
  fileName,
  mimeType,
  bytes,
}: {
  encryptedRefreshToken: string
  folderId: string
  fileName: string
  mimeType: string
  bytes: Buffer
}) {
  const drive = createGoogleDriveClient(encryptedRefreshToken)
  const response = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(bytes) },
    fields: 'id',
  })
  if (!response.data.id) throw new Error('Google Drive did not store the file')
  return { storageKey: response.data.id }
}

export async function downloadGoogleDriveFile(
  encryptedRefreshToken: string,
  storageKey: string,
) {
  const drive = createGoogleDriveClient(encryptedRefreshToken)
  const response = await drive.files.get(
    { fileId: storageKey, alt: 'media' },
    { responseType: 'stream' },
  )
  return response.data
}

export async function deleteGoogleDriveFile(
  encryptedRefreshToken: string,
  storageKey: string,
) {
  const drive = createGoogleDriveClient(encryptedRefreshToken)
  await drive.files.delete({ fileId: storageKey })
}
