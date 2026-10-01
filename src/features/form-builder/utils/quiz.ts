import type { FieldConfig } from "#/features/form-builder/elements";
import type { FormStructure } from "#/features/form-builder/form-structure";
import {
	getOrderedFormFields,
	hasQuizAnswerKey,
	isQuizScoredField,
} from "#/features/form-builder/form-structure";

export interface QuizResult {
	manualScores: Record<string, number>;
	pendingPoints: number;
	releaseInvalidatedAt?: string;
	releasedAt?: string;
	score: number;
	maxScore: number;
}

function hasExactAnswers(expected: string[], actual: unknown): boolean {
	const received = Array.isArray(actual)
		? actual.filter((value): value is string => typeof value === "string")
		: typeof actual === "string"
			? [actual]
			: [];

	return (
		received.length === expected.length &&
		new Set(received).size === received.length &&
		expected.every((answer) => received.includes(answer))
	);
}

function scoreField(field: FieldConfig, value: unknown): number {
	if (!hasQuizAnswerKey(field) || !field.quiz?.correctAnswers) return 0;
	if (field.uniqueIdentifier === "text-input") {
		const answer =
			typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
		return field.quiz.correctAnswers.some(
			(correctAnswer) => correctAnswer.trim().toLocaleLowerCase() === answer,
		)
			? field.quiz.points
			: 0;
	}
	return hasExactAnswers(field.quiz.correctAnswers, value)
		? field.quiz.points
		: 0;
}

export function calculateQuizResult(
	structure: FormStructure,
	data: Record<string, unknown>,
	manualScores: Record<string, number> = {},
): QuizResult | null {
	if (!structure.quiz?.enabled) return null;

	const quizFields = getOrderedFormFields(structure).filter((field) =>
		isQuizScoredField(field, structure.quiz),
	);
	const maxScore = quizFields.reduce(
		(total, field) => total + field.quiz!.points,
		0,
	);
	if (maxScore === 0) return null;

	const normalizedManualScores: Record<string, number> = {};
	let pendingPoints = 0;
	let score = 0;
	for (const field of quizFields) {
		if (hasQuizAnswerKey(field)) {
			score += scoreField(field, data[field.id]);
			continue;
		}

		const manualScore = manualScores[field.id];
		if (typeof manualScore === "number" && Number.isFinite(manualScore)) {
			const points = Math.max(0, Math.min(field.quiz!.points, manualScore));
			normalizedManualScores[field.id] = points;
			score += points;
		} else {
			pendingPoints += field.quiz!.points;
		}
	}

	return {
		manualScores: normalizedManualScores,
		maxScore,
		pendingPoints,
		score,
	};
}
