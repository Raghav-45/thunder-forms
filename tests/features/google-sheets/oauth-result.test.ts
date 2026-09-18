import { describe, expect, it } from 'vitest'
import { googleSheetsOAuthResultMessage } from '@/features/google-sheets/oauth-result'

describe('Google Sheets OAuth result messages', () => {
  it('describes known callback outcomes', () => {
    expect(googleSheetsOAuthResultMessage('connected')).toEqual({
      type: 'success',
      message: 'Google account connected',
    })
    expect(googleSheetsOAuthResultMessage('scope-denied')).toEqual({
      type: 'error',
      message: 'Google did not grant required Drive file access',
    })
    expect(googleSheetsOAuthResultMessage('invalid-client')).toEqual({
      type: 'error',
      message: 'Google rejected OAuth client credentials. Update Client Secret and restart.',
    })
  })

  it('keeps unknown callback failures actionable', () => {
    expect(googleSheetsOAuthResultMessage('failed')).toEqual({
      type: 'error',
      message: 'Google connection failed. Check the server log and try again.',
    })
  })
})
