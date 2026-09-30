export class QuizEmailConfigurationError extends Error {
	constructor() {
		super("Quiz grade email requires RESEND_API_KEY and EMAIL_FROM");
		this.name = "QuizEmailConfigurationError";
	}
}

export interface SendQuizGradeEmailInput {
	recipient: string;
	formTitle: string;
	idempotencyKey: string;
	score: number;
	maxScore: number;
}

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>'"]/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				"'": "&#39;",
				'"': "&quot;",
			})[character]!,
	);
}

export async function sendQuizGradeEmail({
	recipient,
	formTitle,
	idempotencyKey,
	score,
	maxScore,
}: SendQuizGradeEmailInput): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM;

	if (!apiKey || !from) {
		throw new QuizEmailConfigurationError();
	}

	const safeTitle = escapeHtml(formTitle);
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"Idempotency-Key": idempotencyKey,
		},
		body: JSON.stringify({
			from,
			to: [recipient],
			subject: `Your grade for ${formTitle}`,
			html: `<p>Your score for <strong>${safeTitle}</strong> is <strong>${score} / ${maxScore}</strong>.</p>`,
		}),
	}).catch(() => {
		throw new Error("Unable to send quiz grade email");
	});

	if (!response.ok) {
		throw new Error("Unable to send quiz grade email");
	}
}
