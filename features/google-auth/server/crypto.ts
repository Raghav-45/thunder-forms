import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSION = 'v1'

function getEncryptionKey(): Buffer {
  const rawKey = process.env.GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY
  if (!rawKey) {
    throw new Error('GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY is not configured')
  }

  const key = Buffer.from(rawKey, 'base64')
  if (key.length !== 32) {
    throw new Error('GOOGLE_SHEETS_TOKEN_ENCRYPTION_KEY must be 32 bytes in base64')
  }

  return key
}

export function encryptGoogleOAuthSecret(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decryptGoogleOAuthSecret(value: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...rest] = value.split('.')
  if (
    version !== VERSION ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    rest.length > 0
  ) {
    throw new Error('Google Sheets secret is invalid')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64url'),
  )
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
