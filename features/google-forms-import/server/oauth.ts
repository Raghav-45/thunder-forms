import { createHash, randomBytes } from 'node:crypto'
import { CodeChallengeMethod } from 'google-auth-library'
import { google } from 'googleapis'
import { GOOGLE_FORMS_IMPORT_SCOPES } from '@/features/google-forms-import/constants'

interface GoogleFormsImportConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function formsImportCredential(name: 'CLIENT_ID' | 'CLIENT_SECRET'): string {
  return (
    process.env[`GOOGLE_FORMS_IMPORT_OAUTH_${name}`] ||
    required(`GOOGLE_SHEETS_OAUTH_${name}`)
  )
}

function getGoogleFormsImportConfig(): GoogleFormsImportConfig {
  return {
    clientId: formsImportCredential('CLIENT_ID'),
    clientSecret: formsImportCredential('CLIENT_SECRET'),
    redirectUri: required('GOOGLE_FORMS_IMPORT_OAUTH_REDIRECT_URI'),
  }
}

export function createGoogleFormsImportOAuthClient() {
  const config = getGoogleFormsImportConfig()
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  )
}

export function createGoogleFormsImportOAuthAttempt() {
  const state = randomBytes(32).toString('base64url')
  const codeVerifier = randomBytes(64).toString('base64url')
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { state, codeVerifier, codeChallenge }
}

export function createGoogleFormsImportAuthorizationUrl(
  state: string,
  codeChallenge: string,
): string {
  return createGoogleFormsImportOAuthClient().generateAuthUrl({
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    include_granted_scopes: false,
    prompt: 'select_account',
    scope: [...GOOGLE_FORMS_IMPORT_SCOPES],
    state,
  })
}
