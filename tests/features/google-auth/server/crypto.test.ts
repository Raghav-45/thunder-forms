import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decryptGoogleOAuthSecret,
  encryptGoogleOAuthSecret,
} from '@/features/google-auth/server/crypto'

describe('Google OAuth token encryption', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('encrypts and decrypts a token with AES-256-GCM', () => {
    vi.stubEnv(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY',
      Buffer.alloc(32, 7).toString('base64'),
    )

    const encrypted = encryptGoogleOAuthSecret('refresh-token')

    expect(encrypted).not.toContain('refresh-token')
    expect(decryptGoogleOAuthSecret(encrypted)).toBe('refresh-token')
  })

  it('rejects missing or wrong-sized encryption keys', () => {
    expect(() => encryptGoogleOAuthSecret('refresh-token')).toThrow(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY is not configured',
    )

    vi.stubEnv('GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY', 'not-a-key')
    expect(() => encryptGoogleOAuthSecret('refresh-token')).toThrow(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY must be 32 bytes in base64',
    )
  })
})
