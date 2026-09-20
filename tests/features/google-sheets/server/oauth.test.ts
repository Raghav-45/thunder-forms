import { afterEach, describe, expect, it, vi } from 'vitest'
import { GOOGLE_SHEETS_SCOPE } from '@/features/google-sheets/constants'
import {
  createGoogleSheetsAuthorizationUrl,
  createOAuthAttemptValues,
} from '@/features/google-sheets/server/oauth'

describe('Google Sheets OAuth', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('creates unique PKCE values and requests only drive.file access', () => {
    vi.stubEnv('GOOGLE_SHEETS_OAUTH_CLIENT_ID', 'client-id')
    vi.stubEnv('GOOGLE_SHEETS_OAUTH_CLIENT_SECRET', 'client-secret')
    vi.stubEnv('GOOGLE_SHEETS_OAUTH_REDIRECT_URI', 'https://app.test/callback')

    const first = createOAuthAttemptValues()
    const second = createOAuthAttemptValues()
    const url = new URL(
      createGoogleSheetsAuthorizationUrl(first.state, first.codeChallenge),
    )

    expect(first.state).not.toBe(second.state)
    expect(first.codeVerifier).not.toBe(second.codeVerifier)
    expect(url.searchParams.get('state')).toBe(first.state)
    expect(url.searchParams.get('code_challenge')).toBe(first.codeChallenge)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('scope')).toBe(GOOGLE_SHEETS_SCOPE)
  })
})
