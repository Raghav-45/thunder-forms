import {
	type Content,
	FunctionCallingConfigMode,
	GoogleGenAI,
	ThinkingLevel,
} from "@google/genai";
import { createFileRoute } from "@tanstack/react-router";
import {
	GENERATION_TIMEOUT_MS,
	GenerationSession,
	type GenerationUsage,
	MAX_OUTPUT_TOKENS,
	MAX_PROMPT_LENGTH,
} from "#/routes/api/generatewithai/-generation";
import { runGroqGeneration } from "#/routes/api/generatewithai/-groq";
import {
	GET_FIELD_SPEC_TOOLS,
	GET_TEMPLATE_TOOLS,
	MAX_TOOL_TURNS,
	SYSTEM_PROMPT,
} from "#/routes/api/generatewithai/-prompt";

export const Route = createFileRoute("/api/generatewithai")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				let aiPrompt: unknown;
				try {
					const body: unknown = await request.json();
					aiPrompt =
						typeof body === "object" && body !== null && !Array.isArray(body)
							? (body as { prompt?: unknown }).prompt
							: undefined;
				} catch {
					return Response.json(
						{ error: "Prompt parameter is required" },
						{ status: 400 },
					);
				}
				if (typeof aiPrompt !== "string" || !aiPrompt.trim()) {
					return Response.json(
						{ error: "Prompt parameter is required" },
						{ status: 400 },
					);
				}
				if (aiPrompt.length > MAX_PROMPT_LENGTH) {
					return Response.json(
						{ error: `Prompt must be at most ${MAX_PROMPT_LENGTH} characters` },
						{ status: 400 },
					);
				}

				// Both providers share tools, validation, and the response contract.
				const provider = process.env.AI_PROVIDER ?? "gemini";
				if (provider === "groq") {
					return runGroqGeneration(aiPrompt.trim(), request.signal);
				}
				if (provider !== "gemini" || !process.env.GEMINI_API_KEY) {
					console.error("AI form generation provider is not configured");
					return Response.json(
						{ error: "AI generation is not configured" },
						{ status: 500 },
					);
				}

				const startTime = Date.now();
				const signal = AbortSignal.any([
					request.signal,
					AbortSignal.timeout(GENERATION_TIMEOUT_MS),
				]);
				try {
					const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
					const session = new GenerationSession();
					const usage: GenerationUsage = { inputTokens: 0, outputTokens: 0 };
					// The model pulls only the specs and templates needed by this request.
					const contents: Content[] = [
						{ parts: [{ text: aiPrompt.trim() }], role: "user" },
					];
					for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
						signal.throwIfAborted();
						const response = await ai.models.generateContent({
							model: "gemini-3.1-flash-lite",
							contents,
							config: {
								abortSignal: signal,
								httpOptions: {
									timeout: GENERATION_TIMEOUT_MS,
									retryOptions: { attempts: 1 },
								},
								maxOutputTokens: MAX_OUTPUT_TOKENS,
								systemInstruction: SYSTEM_PROMPT,
								thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
								temperature: 0.1,
								tools: [
									{
										functionDeclarations: [
											...GET_FIELD_SPEC_TOOLS,
											...GET_TEMPLATE_TOOLS,
										],
									},
								],
								// First turn must fetch specs; later turns may answer.
								toolConfig: {
									functionCallingConfig: {
										mode:
											turn === 0
												? FunctionCallingConfigMode.ANY
												: FunctionCallingConfigMode.AUTO,
									},
								},
							},
						});
						signal.throwIfAborted();
						usage.inputTokens += response.usageMetadata?.promptTokenCount ?? 0;
						usage.outputTokens +=
							(response.usageMetadata?.candidatesTokenCount ?? 0) +
							(response.usageMetadata?.thoughtsTokenCount ?? 0);

						const functionCalls = response.functionCalls;
						if (!functionCalls?.length) {
							if (turn === 0) break;
							return session.createResponse(
								response.text ?? "",
								startTime,
								usage,
							);
						}
						if (turn === MAX_TOOL_TURNS) break;

						// Replay complete model content to preserve thought signatures.
						contents.push(
							response.candidates?.[0]?.content ?? {
								parts: functionCalls.map((call) => ({ functionCall: call })),
								role: "model",
							},
						);
						contents.push({
							parts: functionCalls.map((call) => ({
								functionResponse: {
									...(call.id ? { id: call.id } : {}),
									name: call.name ?? "unknown_tool",
									response: session.executeToolCall(call.name, call.args),
								},
							})),
							role: "user",
						});
						const direct = session.getDirectTemplateResponse(
							functionCalls.length,
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
								error: request.signal.aborted
									? "AI generation was canceled"
									: "AI generation timed out, please try again",
							},
							{ status: request.signal.aborted ? 499 : 504 },
						);
					}
					console.error("AI form generation failed:", error);
					// Surface upstream quota failures distinctly for retry feedback.
					const status =
						typeof error === "object" && error !== null
							? (error as { status?: unknown }).status
							: undefined;
					return Response.json(
						{
							error:
								status === 429
									? "AI quota exceeded, please try again later"
									: "Failed to generate form",
						},
						{ status: status === 429 ? 429 : 500 },
					);
				}
			},
		},
	},
});
