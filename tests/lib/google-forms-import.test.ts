import { extractFormId, isResponderLink } from '@/lib/google-forms-import'
import { describe, expect, it } from 'vitest'

describe('Google Forms URL parsing', () => {
  it('recognizes responder links', () => {
    expect(
      isResponderLink('https://docs.google.com/forms/d/e/1FAIpQLSc/viewform'),
    ).toBe(true)
  })

  it('does not mistake an editable form URL for a responder link', () => {
    expect(
      isResponderLink('https://docs.google.com/forms/d/form_ABC-123/edit'),
    ).toBe(false)
  })

  it('extracts an editable form identifier from supported URLs', () => {
    expect(
      extractFormId('https://docs.google.com/forms/d/form_ABC-123/viewform'),
    ).toBe('form_ABC-123')
  })

  it('rejects responder links as form identifiers', () => {
    expect(
      extractFormId('https://docs.google.com/forms/d/e/1FAIpQLSc/viewform'),
    ).toBeNull()
  })

  it('rejects a form-shaped path on a non-Google host', () => {
    expect(extractFormId('https://example.com/forms/d/form_ABC-123')).toBeNull()
  })

  it('rejects a string without a Google Form identifier', () => {
    expect(extractFormId('not a URL')).toBeNull()
  })
})
