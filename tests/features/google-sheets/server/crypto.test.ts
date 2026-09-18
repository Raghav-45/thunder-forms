import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decryptGoogleSheetsSecret,
  encryptGoogleSheetsSecret,
} from '@/features/google-sheets/server/crypto'

describe('Google Sheets token encryption', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('encrypts and decrypts a token with AES-256-GCM', () => {
    vi.stubEnv(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY',
      Buffer.alloc(32, 7).toString('base64'),
    )

    const encrypted = encryptGoogleSheetsSecret('refresh-token')

    expect(encrypted).not.toContain('refresh-token')
    expect(decryptGoogleSheetsSecret(encrypted)).toBe('refresh-token')
  })

  it('rejects missing or wrong-sized encryption keys', () => {
    expect(() => encryptGoogleSheetsSecret('refresh-token')).toThrow(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY is not configured',
    )

    vi.stubEnv('GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY', 'not-a-key')
    expect(() => encryptGoogleSheetsSecret('refresh-token')).toThrow(
      'GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY must be 32 bytes in base64',
    )
  })
})
