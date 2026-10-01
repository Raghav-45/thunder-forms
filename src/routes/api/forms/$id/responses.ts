import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "#/db";
import {
	getOrderedFormFields,
	getQuizGradeRelease,
	hasQuizAnswerKey,
	isFormStructure,
	isQuizScoredField,
} from "#/features/form-builder/form-structure";
import {
	QuizEmailConfigurationError,
	sendQuizGradeEmail,
} from "#/features/form-builder/server/quiz-email";
import { calculateQuizResult } from "#/features/form-builder/utils/quiz";
import { getSessionUserId } from "#/lib/server/session";

type ManualScoreUpdate = Record<string, number | null>;

function isManualScoreMap(value: unknown): value is ManualScoreUpdate {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value).every(
			(score) =>
				score === null || (typeof score === "number" && Number.isFinite(score)),
		)
	);
}

function isScoreMap(value: unknown): value is Record<string, number> {
	return (
		isManualScoreMap(value) &&
		Object.values(value).every(
			(score): score is number => typeof score === "number",
		)
	);
}

function hasSameScores(
	first: Record<string, number>,
	second: Record<string, number>,
): boolean {
	const firstEntries = Object.entries(first);
	return (
		firstEntries.length === Object.keys(second).length &&
		firstEntries.every(([fieldId, score]) => second[fieldId] === score)
	);
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const Route = createFileRoute("/api/forms/$id/responses")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					// Fetch form with its responses
					const formWithResponses = await prisma.forms.findUnique({
						where: { id: params.id },
						include: {
							responses: {
								orderBy: {
									createdAt: "desc", // Get newest responses first
								},
							},
						},
					});

					if (!formWithResponses) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					if (formWithResponses.userId !== userId) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}

					return Response.json({
						formId: formWithResponses.id,
						title: formWithResponses.title,
						fields: formWithResponses.fields,
						responses: formWithResponses.responses,
					});
				} catch (error) {
					console.error("Get form responses error:", error);

					// Handle different types of errors
					if (error instanceof Error) {
						// Prisma or other known errors
						return Response.json(
							{
								error: "Database error occurred",
								message:
									process.env.NODE_ENV === "development"
										? error.message
										: undefined,
							},
							{ status: 500 },
						);
					}

					// Unknown errors
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
			PATCH: async ({ params, request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const formId = params.id;
					const body = await request.json();
					const responseId = body?.responseId;
					const manualScores = body?.manualScores;
					const release = body?.release === true;
					if (
						typeof responseId !== "string" ||
						(!release && !isManualScoreMap(manualScores)) ||
						(manualScores !== undefined && !isManualScoreMap(manualScores))
					) {
						return Response.json(
							{ error: "Invalid grading request" },
							{ status: 400 },
						);
					}
					const submittedScores = isManualScoreMap(manualScores)
						? manualScores
						: {};

					const form = await prisma.forms.findUnique({
						where: { id: formId },
						include: { responses: { where: { id: responseId } } },
					});
					if (!form)
						return Response.json({ error: "Form not found" }, { status: 404 });
					if (form.userId !== userId) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const structure = form.fields;
					if (!isFormStructure(structure) || !structure.quiz?.enabled) {
						return Response.json(
							{ error: "Form is not a quiz" },
							{ status: 422 },
						);
					}
					const quizSettings = structure.quiz;

					const response = form.responses[0];
					if (
						!response ||
						typeof response.data !== "object" ||
						response.data === null
					) {
						return Response.json(
							{ error: "Response not found" },
							{ status: 404 },
						);
					}

					const manualFields = getOrderedFormFields(structure).filter(
						(field) =>
							isQuizScoredField(field, quizSettings) &&
							!hasQuizAnswerKey(field),
					);
					const manualPoints = new Map(
						manualFields.map((field) => [field.id, field.quiz!.points]),
					);
					if (
						Object.entries(submittedScores).some(
							([fieldId, score]) =>
								!manualPoints.has(fieldId) ||
								(score !== null &&
									(score < 0 || score > manualPoints.get(fieldId)!)),
						)
					) {
						return Response.json(
							{ error: "Invalid manual score" },
							{ status: 422 },
						);
					}

					const responseData = response.data as Record<string, unknown>;
					const previousQuiz = responseData.__quiz;
					const previousScores =
						typeof previousQuiz === "object" &&
						previousQuiz !== null &&
						isScoreMap(
							(previousQuiz as { manualScores?: unknown }).manualScores,
						)
							? (previousQuiz as { manualScores: Record<string, number> })
									.manualScores
							: {};
					const nextScores = { ...previousScores };
					for (const [fieldId, score] of Object.entries(submittedScores)) {
						if (score === null) delete nextScores[fieldId];
						else nextScores[fieldId] = score;
					}
					const quizResult = calculateQuizResult(
						structure,
						responseData,
						nextScores,
					);
					if (!quizResult)
						return Response.json(
							{ error: "Quiz has no graded questions" },
							{ status: 422 },
						);

					const releasedAt =
						typeof previousQuiz === "object" &&
						previousQuiz !== null &&
						typeof (previousQuiz as { releasedAt?: unknown }).releasedAt ===
							"string"
							? (previousQuiz as { releasedAt: string }).releasedAt
							: undefined;
					const releaseInvalidatedAt =
						typeof previousQuiz === "object" &&
						previousQuiz !== null &&
						typeof (previousQuiz as { releaseInvalidatedAt?: unknown })
							.releaseInvalidatedAt === "string"
							? (previousQuiz as { releaseInvalidatedAt: string })
									.releaseInvalidatedAt
							: undefined;
					let storedQuiz = quizResult;
					if (release) {
						if (releasedAt) {
							return Response.json(
								{ error: "Grade has already been released" },
								{ status: 409 },
							);
						}
						if (getQuizGradeRelease(quizSettings) !== "after-review") {
							return Response.json(
								{ error: "This quiz releases grades immediately" },
								{ status: 422 },
							);
						}
						if (quizResult.pendingPoints > 0) {
							return Response.json(
								{ error: "Grade every manual question before release" },
								{ status: 422 },
							);
						}

						const recipientFieldId = quizSettings.recipientEmailFieldId;
						const recipientField = getOrderedFormFields(structure).find(
							(field) =>
								field.id === recipientFieldId &&
								field.uniqueIdentifier === "text-input" &&
								(field as { inputType?: string }).inputType === "email",
						);
						const recipient = recipientField
							? responseData[recipientField.id]
							: undefined;
						if (typeof recipient !== "string" || !isEmail(recipient)) {
							return Response.json(
								{
									error:
										"Select an email question and collect a valid email before release",
								},
								{ status: 422 },
							);
						}

						await sendQuizGradeEmail({
							formTitle: form.title,
							idempotencyKey: `quiz-grade/${response.id}/${releaseInvalidatedAt ?? response.id}`,
							maxScore: quizResult.maxScore,
							recipient,
							score: quizResult.score,
						});
						storedQuiz = {
							...quizResult,
							releasedAt: new Date().toISOString(),
						};
					} else if (releasedAt) {
						const previousScore =
							typeof previousQuiz === "object" && previousQuiz !== null
								? (previousQuiz as {
										maxScore?: unknown;
										pendingPoints?: unknown;
										score?: unknown;
									})
								: {};
						const scoreChanged =
							previousScore.maxScore !== quizResult.maxScore ||
							previousScore.pendingPoints !== quizResult.pendingPoints ||
							previousScore.score !== quizResult.score ||
							!hasSameScores(previousScores, quizResult.manualScores);
						storedQuiz = scoreChanged
							? {
									...quizResult,
									releaseInvalidatedAt: new Date().toISOString(),
								}
							: { ...quizResult, releasedAt };
					} else if (releaseInvalidatedAt) {
						storedQuiz = { ...quizResult, releaseInvalidatedAt };
					}

					const updatedResponse = await prisma.responses.update({
						where: { id: response.id },
						data: {
							data: JSON.parse(
								JSON.stringify({ ...responseData, __quiz: storedQuiz }),
							),
						},
					});
					return Response.json(updatedResponse);
				} catch (error) {
					console.error("Grade quiz response error:", error);
					if (error instanceof QuizEmailConfigurationError) {
						return Response.json(
							{ error: "Quiz email delivery is not configured" },
							{ status: 503 },
						);
					}
					return Response.json(
						{ error: "Failed to grade response" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
