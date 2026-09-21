import { parseValidDate } from '@/features/form-builder/elements/fields/date-picker'
import { describe, expect, it } from 'vitest'

describe('date picker persisted values', () => {
  it('accepts a valid serialized date', () => {
    const date = parseValidDate('2026-01-15T13:30:00.000Z')

    expect(date?.toISOString()).toBe('2026-01-15T13:30:00.000Z')
  })

  it.each([undefined, '', 'not-a-date', {}, 0])(
    'treats malformed persisted values as unselected: %j',
    (value) => {
      expect(parseValidDate(value)).toBeUndefined()
    },
  )

  it('clones valid Date values before using them', () => {
    const source = new Date(2026, 0, 15)
    const date = parseValidDate(source)

    expect(date).toEqual(source)
    expect(date).not.toBe(source)
  })
})
