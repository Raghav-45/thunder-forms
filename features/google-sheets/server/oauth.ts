import { createHash, randomBytes } from 'node:crypto'
import { CodeChallengeMethod } from 'google-auth-library'
import { google } from 'googleapis'
import { GOOGLE_SHEETS_SCOPE } from '@/features/google-sheets/constants'
import { getGoogleSheetsConfig } from './config'

export function createGoogleSheetsOAuthClient() {
  const config = getGoogleSheetsConfig()
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  )
}

export function createOAuthAttemptValues() {
  const state = randomBytes(32).toString('base64url')
  const codeVerifier = randomBytes(64).toString('base64url')
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { state, codeVerifier, codeChallenge }
}

export function createGoogleSheetsAuthorizationUrl(
  state: string,
  codeChallenge: string,
): string {
  return createGoogleSheetsOAuthClient().generateAuthUrl({
    access_type: 'offline',
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    include_granted_scopes: true,
    prompt: 'consent select_account',
    scope: [GOOGLE_SHEETS_SCOPE],
    state,
  })
}
