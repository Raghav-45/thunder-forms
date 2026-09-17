import { FormValidator } from '@/lib/validators/form'
import { afterEach, describe, expect, it, vi } from 'vitest'

const validPayload = {
  title: 'Contact form',
  fields: { pages: [] },
}

describe('FormValidator', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts a complete valid payload', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))

    expect(
      FormValidator.parse({
        ...validPayload,
        description: 'Collect contact requests',
        maxSubmissions: 25,
        expiresAt: '2030-06-01T00:00:00.000Z',
        redirectUrl: 'https://example.com/thanks',
        submitButtonText: 'Send request',
      }),
    ).toMatchObject({
      title: 'Contact form',
      maxSubmissions: 25,
      redirectUrl: 'https://example.com/thanks',
    })
  })

  it('rejects a title shorter than two characters', () => {
    const result = FormValidator.safeParse({ ...validPayload, title: 'A' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['title'], message: 'Title is required' }),
      )
    }
  })

  it.each([0, -1, 1.5])('rejects invalid submission limit %s', (maxSubmissions) => {
    expect(
      FormValidator.safeParse({ ...validPayload, maxSubmissions }).success,
    ).toBe(false)
  })

  it('accepts a null submission limit', () => {
    expect(
      FormValidator.safeParse({ ...validPayload, maxSubmissions: null }).success,
    ).toBe(true)
  })

  it('rejects an expiration date that is not in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))

    const result = FormValidator.safeParse({
      ...validPayload,
      expiresAt: '2030-01-01T00:00:00.000Z',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['expiresAt'],
          message: 'Expiration date must be in the future',
        }),
      )
    }
  })

  it('rejects an invalid redirect URL and an overlong submit label', () => {
    const result = FormValidator.safeParse({
      ...validPayload,
      redirectUrl: 'not a URL',
      submitButtonText: 'x'.repeat(51),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['redirectUrl'],
            message: 'Must be a valid URL',
          }),
          expect.objectContaining({
            path: ['submitButtonText'],
            message: 'Must be 50 characters or less',
          }),
        ]),
      )
    }
  })
})
