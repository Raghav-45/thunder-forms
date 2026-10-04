import Groq from "groq-sdk";
import {
	GENERATION_TIMEOUT_MS,
	GenerationSession,
	type GenerationUsage,
	MAX_OUTPUT_TOKENS,
} from "#/routes/api/generatewithai/-generation";
import {
	GET_FIELD_SPEC_TOOLS,
	GET_TEMPLATE_TOOLS,
	MAX_TOOL_TURNS,
	SYSTEM_PROMPT,
} from "#/routes/api/generatewithai/-prompt";

// Groq provider: same agentic loop and response contract as the Gemini path in
// route.ts, only the transport differs (OpenAI-compatible chat completions).
// Tool declarations stay single-sourced in -prompt.ts; this module only
// reshapes them (Gemini Type enums already serialize to "OBJECT"/"STRING").

const GROQ_MODEL = "openai/gpt-oss-20b";

// Gemini declarations use UPPERCASE type names; Groq validates strict
// lowercase JSON Schema, so normalize every `type` on the way over.
const GEMINI_TO_JSON_SCHEMA_TYPE: Record<string, string> = {
	STRING: "string",
	NUMBER: "number",
	INTEGER: "integer",
	BOOLEAN: "boolean",
	ARRAY: "array",
	OBJECT: "object",
	NULL: "null",
};

function normalizeSchema(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalizeSchema);
	if (typeof value === "object" && value !== null) {
		const normalized: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) {
			normalized[key] =
				key === "type" && typeof entry === "string"
					? (GEMINI_TO_JSON_SCHEMA_TYPE[entry] ?? entry)
					: normalizeSchema(entry);
		}
		return normalized;
	}
	return value;
}

export function buildGroqTools(): Groq.Chat.ChatCompletionTool[] {
	const tools: Groq.Chat.ChatCompletionTool[] = [];
	for (const tool of [...GET_FIELD_SPEC_TOOLS, ...GET_TEMPLATE_TOOLS]) {
		if (!tool.name) continue;
		tools.push({
			type: "function",
			function: {
				...(tool.description ? { description: tool.description } : {}),
				...(tool.parameters
					? {
							parameters: normalizeSchema(tool.parameters) as Record<
								string,
								unknown
							>,
						}
					: {}),
				name: tool.name,
			},
		});
	}
	return tools;
}

function parseArgs(raw: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(raw);
		return typeof parsed === "object" &&
			parsed !== null &&
			!Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		// Unparseable args become an empty call; resolvers answer with a
		// recoverable error so the loop continues instead of crashing.
		return {};
	}
}

export async function runGroqGeneration(
	aiPrompt: string,
	requestSignal?: AbortSignal,
): Promise<Response> {
	const startTime = Date.now();
	if (!process.env.GROQ_API_KEY) {
		console.error("AI form generation failed: GROQ_API_KEY is not configured");
		return Response.json(
			{ error: "AI generation is not configured" },
			{ status: 500 },
		);
	}
	const signal = AbortSignal.any([
		...(requestSignal ? [requestSignal] : []),
		AbortSignal.timeout(GENERATION_TIMEOUT_MS),
	]);
	try {
		const groq = new Groq({
			apiKey: process.env.GROQ_API_KEY,
			maxRetries: 0,
			timeout: GENERATION_TIMEOUT_MS,
		});
		const session = new GenerationSession();
		const usage: GenerationUsage = { inputTokens: 0, outputTokens: 0 };
		const tools = buildGroqTools();
		const messages: Groq.Chat.ChatCompletionMessageParam[] = [
			{ content: SYSTEM_PROMPT, role: "system" },
			{ content: aiPrompt, role: "user" },
		];
		for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
			signal.throwIfAborted();
			const completion = await groq.chat.completions.create(
				{
					max_completion_tokens: MAX_OUTPUT_TOKENS,
					messages,
					model: GROQ_MODEL,
					temperature: 0.1,
					tools,
					tool_choice: turn === 0 ? "required" : "auto",
				},
				{ signal },
			);
			signal.throwIfAborted();
			usage.inputTokens += completion.usage?.prompt_tokens ?? 0;
			usage.outputTokens += completion.usage?.completion_tokens ?? 0;

			const message = completion.choices[0]?.message;
			const toolCalls = message?.tool_calls ?? [];
			if (!toolCalls.length) {
				if (turn === 0) break;
				return session.createResponse(message?.content ?? "", startTime, usage);
			}
			if (turn === MAX_TOOL_TURNS) break;

			if (message) messages.push(message);
			for (const call of toolCalls) {
				messages.push({
					content: JSON.stringify(
						session.executeToolCall(
							call.function?.name,
							parseArgs(call.function?.arguments ?? "{}"),
						),
					),
					role: "tool",
					tool_call_id: call.id,
				});
			}
			const direct = session.getDirectTemplateResponse(
				toolCalls.length,
				startTime,
				usage,
			);
			if (direct) return direct;
		}
		return Response.json(
			{ error: "AI could not complete the form" },
			{ status: 502 },
		);
	} catch (error) {
		if (signal.aborted) {
			return Response.json(
				{
					error: requestSignal?.aborted
						? "AI generation was canceled"
						: "AI generation timed out, please try again",
				},
				{ status: requestSignal?.aborted ? 499 : 504 },
			);
		}
		console.error("AI form generation failed:", error);
		// Surface retryable upstream failures distinctly instead of
		// collapsing everything into a generic 500.
		const status =
			typeof error === "object" &&
			error !== null &&
			typeof (error as { status?: unknown }).status === "number"
				? (error as { status: number }).status
				: 500;
		if (status === 429) {
			return Response.json(
				{ error: "AI quota exceeded, please try again later" },
				{ status: 429 },
			);
		}
		return Response.json({ error: "Failed to generate form" }, { status: 500 });
	}
}
