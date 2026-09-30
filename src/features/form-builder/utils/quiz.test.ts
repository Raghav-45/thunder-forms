import { describe, expect, it } from "vitest";
import type { FormStructure } from "@/features/form-builder/form-structure";
import { calculateQuizResult } from "@/features/form-builder/utils/quiz";

const quiz = (
	overrides: Partial<FormStructure["quiz"]> = {},
): FormStructure => ({
	quiz: { enabled: true, ...overrides },
	pages: [
		{
			id: "page-1",
			sections: [
				{
					id: "section-1",
					fields: [
						{
							id: "single-answer",
							label: "Single answer",
							uniqueIdentifier: "radio-group",
							options: [
								{ id: "a", label: "A", value: "a" },
								{ id: "b", label: "B", value: "b" },
							],
							quiz: { correctAnswers: ["a"], points: 2 },
						},
						{
							id: "multiple-answer",
							label: "Multiple answer",
							uniqueIdentifier: "multi-select",
							options: [
								{ id: "a", label: "A", value: "a" },
								{ id: "b", label: "B", value: "b" },
								{ id: "c", label: "C", value: "c" },
							],
							quiz: { correctAnswers: ["a", "c"], points: 3 },
						},
					],
				},
			],
		},
	],
});

describe("calculateQuizResult", () => {
	it("scores correct choice answers and requires an exact checkbox match", () => {
		expect(
			calculateQuizResult(quiz(), {
				"single-answer": "a",
				"multiple-answer": ["c", "a"],
			}),
		).toEqual({ manualScores: {}, pendingPoints: 0, score: 5, maxScore: 5 });

		expect(
			calculateQuizResult(quiz(), {
				"single-answer": "b",
				"multiple-answer": ["a", "b", "c"],
			}),
		).toEqual({ manualScores: {}, pendingPoints: 0, score: 0, maxScore: 5 });
	});

	it("scores short text answers and leaves other question types pending", () => {
		const structure: FormStructure = {
			quiz: { enabled: true },
			pages: [
				{
					id: "page-1",
					sections: [
						{
							id: "section-1",
							fields: [
								{
									id: "short-answer",
									label: "Short answer",
									uniqueIdentifier: "text-input",
									inputType: "text",
									quiz: {
										correctAnswers: ["Planet Earth", "Earth"],
										points: 2,
									},
								},
								{
									id: "essay",
									label: "Essay",
									uniqueIdentifier: "text-area",
									quiz: { points: 4 },
								},
							],
						},
					],
				},
			],
		};

		expect(
			calculateQuizResult(structure, {
				"short-answer": " earth ",
				essay: "Response",
			}),
		).toEqual({
			manualScores: {},
			pendingPoints: 4,
			score: 2,
			maxScore: 6,
		});

		expect(
			calculateQuizResult(
				structure,
				{
					"short-answer": "earth",
					essay: "Response",
				},
				{ essay: 3 },
			),
		).toEqual({
			manualScores: { essay: 3 },
			pendingPoints: 0,
			score: 5,
			maxScore: 6,
		});
	});

	it("does not score forms that are not quizzes", () => {
		expect(
			calculateQuizResult(quiz({ enabled: false }), {
				"single-answer": "a",
				"multiple-answer": ["a", "c"],
			}),
		).toBeNull();
	});

	it("does not score an email question selected for delayed grade delivery", () => {
		const structure: FormStructure = {
			quiz: { enabled: true, recipientEmailFieldId: "email" },
			pages: [
				{
					id: "page-1",
					sections: [
						{
							id: "section-1",
							fields: [
								{
									id: "email",
									label: "Email",
									uniqueIdentifier: "text-input",
									inputType: "email",
									quiz: { points: 1 },
								},
								{
									id: "essay",
									label: "Essay",
									uniqueIdentifier: "text-area",
									quiz: { points: 4 },
								},
							],
						},
					],
				},
			],
		};

		expect(
			calculateQuizResult(structure, {
				email: "student@example.com",
				essay: "Answer",
			}),
		).toEqual({ manualScores: {}, pendingPoints: 4, score: 0, maxScore: 4 });
	});
});
