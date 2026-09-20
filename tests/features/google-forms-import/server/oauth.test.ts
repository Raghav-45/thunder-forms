import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGoogleFormsImportAuthorizationUrl,
  createGoogleFormsImportOAuthAttempt,
} from '@/features/google-forms-import/server/oauth'
import { GOOGLE_FORMS_IMPORT_SCOPES } from '@/features/google-forms-import/constants'

describe('Google Forms import OAuth', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses PKCE and requests only temporary read scopes', () => {
    vi.stubEnv('GOOGLE_FORMS_IMPORT_OAUTH_CLIENT_ID', 'client-id')
    vi.stubEnv('GOOGLE_FORMS_IMPORT_OAUTH_CLIENT_SECRET', 'client-secret')
    vi.stubEnv(
      'GOOGLE_FORMS_IMPORT_OAUTH_REDIRECT_URI',
      'https://app.test/api/integrations/google-forms-import/callback',
    )

    const first = createGoogleFormsImportOAuthAttempt()
    const second = createGoogleFormsImportOAuthAttempt()
    const url = new URL(
      createGoogleFormsImportAuthorizationUrl(first.state, first.codeChallenge),
    )

    expect(first.state).not.toBe(second.state)
    expect(first.codeVerifier).not.toBe(second.codeVerifier)
    expect(url.searchParams.get('state')).toBe(first.state)
    expect(url.searchParams.get('code_challenge')).toBe(first.codeChallenge)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('prompt')).toBe('select_account')
    expect(url.searchParams.get('access_type')).not.toBe('offline')
    expect(url.searchParams.get('scope')?.split(' ').sort()).toEqual(
      [...GOOGLE_FORMS_IMPORT_SCOPES].sort(),
    )
  })
})
