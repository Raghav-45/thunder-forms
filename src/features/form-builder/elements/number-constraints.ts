export function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function isOnStep(value: number, step: number, base = 0): boolean {
  const stepsFromBase = (value - base) / step
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(stepsFromBase)) * 4

  return Math.abs(stepsFromBase - Math.round(stepsFromBase)) <= tolerance
}
