import { getFormStatus } from '@/app/api/forms/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getFormStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns active when no closing condition applies', () => {
    expect(getFormStatus(0, null, null)).toBe('Active')
  })

  it('returns completed when response count reaches the configured limit', () => {
    expect(getFormStatus(3, 3, null)).toBe('Closed | Completed')
  })

  it('does not close a form for a zero submission limit', () => {
    expect(getFormStatus(10, 0, null)).toBe('Active')
  })

  it('returns expired when expiration is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-02T00:00:00.000Z'))

    expect(getFormStatus(0, null, '2030-01-01T00:00:00.000Z')).toBe(
      'Closed | Expired',
    )
  })

  it('reports both closure reasons when a form is expired and full', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-02T00:00:00.000Z'))

    expect(getFormStatus(3, 3, '2030-01-01T00:00:00.000Z')).toBe(
      'Closed | Expired & Completed',
    )
  })
})
