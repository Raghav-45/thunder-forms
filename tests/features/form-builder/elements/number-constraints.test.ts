import {
  isOnStep,
  isPositiveFiniteNumber,
} from '@/features/form-builder/elements/number-constraints'
import { describe, expect, it } from 'vitest'

describe('numeric field constraints', () => {
  it('accepts only positive finite steps', () => {
    expect(isPositiveFiniteNumber(0.25)).toBe(true)
    expect(isPositiveFiniteNumber(0)).toBe(false)
    expect(isPositiveFiniteNumber(-1)).toBe(false)
    expect(isPositiveFiniteNumber(Number.NaN)).toBe(false)
  })

  it('accepts decimal values aligned to their step without precision errors', () => {
    expect(isOnStep(0.35, 0.25, 0.1)).toBe(true)
    expect(isOnStep(0.6, 0.25, 0.1)).toBe(true)
    expect(isOnStep(0.4, 0.25, 0.1)).toBe(false)
  })
})
