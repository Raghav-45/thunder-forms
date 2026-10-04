export function isPositiveFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isOnStep(value: number, step: number, base = 0): boolean {
	const stepsFromBase = (value - base) / step;
	const tolerance = Number.EPSILON * Math.max(1, Math.abs(stepsFromBase)) * 4;

	return Math.abs(stepsFromBase - Math.round(stepsFromBase)) <= tolerance;
}

/**
 * Clamp an inherited slider default to its nearest valid step.
 * Callers must validate finite inputs, min <= max, and step > 0 first.
 */
export function clampSliderDefaultValue(
	value: number,
	min: number,
	max: number,
	step: number,
): number {
	const clampedValue = Math.min(max, Math.max(min, value));
	const stepsToMax = (max - min) / step;
	const lastStep = isOnStep(max, step, min)
		? Math.round(stepsToMax)
		: Math.floor(stepsToMax);
	const valueStep = Math.min(lastStep, Math.round((clampedValue - min) / step));
	return Math.min(max, min + valueStep * step);
}
