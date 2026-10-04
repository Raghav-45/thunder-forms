import {
	type Content,
	type FunctionCall,
	FunctionCallingConfigMode,
	GenerateContentResponse,
	ThinkingLevel,
} from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GeneratedForm } from "#/features/form-builder/core/generated-form";
import {
	getOrderedFormFields,
	isFormStructure,
} from "#/features/form-builder/form-structure";
import {
	GENERATION_TIMEOUT_MS,
	type GenerationUsage,
	MAX_OUTPUT_TOKENS,
	MAX_PROMPT_LENGTH,
} from "#/routes/api/generatewithai/-generation";
import { MAX_TOOL_TURNS } from "#/routes/api/generatewithai/-prompt";

const { generateMock, groqMock } = vi.hoisted(() => ({
	generateMock: vi.fn(),
	groqMock: vi.fn(),
}));

vi.mock("@google/genai", async (importOriginal) => {
	const original = await importOriginal<typeof import("@google/genai")>();
	return {
		...original,
		GoogleGenAI: vi.fn(
			class {
				models = { generateContent: generateMock };
			},
		),
	};
});

vi.mock("#/routes/api/generatewithai/-groq", () => ({
	runGroqGeneration: groqMock,
}));

import { Route } from "#/routes/api/generatewithai/route";

const { POST } = (
	Route as unknown as {
		options: {
			server: {
				handlers: {
					POST: (args: { request: Request }) => Promise<Response>;
				};
			};
		};
	}
).options.server.handlers;

type GeneratedBody = GeneratedForm & {
	meta: { usage: GenerationUsage };
};

const feedback = {
	title: "Basic feedback",
	description: "Share your feedback.",
	fields: {
		pages: [
			{
				sections: [
					{
						fields: [
							{ uniqueIdentifier: "text-input", label: "Name", required: true },
							{
								uniqueIdentifier: "text-area",
								label: "Message",
								required: true,
							},
						],
					},
				],
			},
		],
	},
};

function toolResponse(calls: FunctionCall[]) {
	const response = new GenerateContentResponse();
	response.candidates = [
		{
			content: {
				role: "model",
				parts: calls.map((functionCall, index) => ({
					functionCall,
					...(index === 0 ? { thoughtSignature: "test-signature" } : {}),
				})),
			},
		},
	];
	return response;
}

function finalResponse(text: string) {
	const response = new GenerateContentResponse();
	response.candidates = [{ content: { role: "model", parts: [{ text }] } }];
	return response;
}

const requestFor = (body: unknown, signal?: AbortSignal) =>
	new Request("http://localhost/api/generatewithai", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});

describe("POST /api/generatewithai", () => {
	beforeEach(() => {
		generateMock.mockReset();
		groqMock.mockReset();
		vi.stubEnv("GEMINI_API_KEY", "test-key");
		vi.stubEnv("AI_PROVIDER", undefined);
		vi.stubEnv("NODE_ENV", "production");
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("loads only requested specs and preserves signatures, IDs, complete text, and token usage", async () => {
		const initial = toolResponse([
			{ id: "name-call", name: "get_text_input_spec", args: {} },
			{ id: "message-call", name: "get_text_area_spec", args: {} },
		]);
		initial.usageMetadata = {
			promptTokenCount: 120,
			candidatesTokenCount: 15,
			thoughtsTokenCount: 3,
		};
		const json = JSON.stringify(feedback);
		const final = finalResponse(json);
		final.candidates = [
			{
				content: {
					parts: [
						{ text: "Internal thought that is not JSON", thought: true },
						{ text: json.slice(0, 45) },
						{ text: json.slice(45) },
					],
				},
			},
		];
		final.usageMetadata = {
			promptTokenCount: 240,
			candidatesTokenCount: 60,
			thoughtsTokenCount: 2,
		};
		generateMock.mockResolvedValueOnce(initial).mockResolvedValueOnce(final);

		const response = await POST({
			request: requestFor({
				prompt: "Create basic feedback with name and message",
			}),
		});

		expect(response.status).toBe(200);
		const body: GeneratedBody = await response.json();
		expect(isFormStructure(body.fields)).toBe(true);
		expect(getOrderedFormFields(body.fields)).toMatchObject(
			feedback.fields.pages[0].sections[0].fields,
		);
		expect(body.meta.usage).toEqual({ inputTokens: 360, outputTokens: 80 });
		expect(generateMock).toHaveBeenCalledTimes(2);
		const firstConfig = generateMock.mock.calls[0][0].config;
		expect(firstConfig).toMatchObject({
			maxOutputTokens: MAX_OUTPUT_TOKENS,
			thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
			httpOptions: {
				timeout: GENERATION_TIMEOUT_MS,
				retryOptions: { attempts: 1 },
			},
			toolConfig: {
				functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
			},
		});
		expect(firstConfig.abortSignal).toBeInstanceOf(AbortSignal);
		const next = generateMock.mock.calls[1][0];
		expect(next.config.toolConfig.functionCallingConfig.mode).toBe(
			FunctionCallingConfigMode.AUTO,
		);
		const contents = next.contents as Content[];
		expect(contents[1]).toBe(initial.candidates?.[0]?.content);
		expect(contents[1].parts?.[0].thoughtSignature).toBe("test-signature");
		expect(contents[2].parts).toMatchObject([
			{
				functionResponse: {
					id: "name-call",
					name: "get_text_input_spec",
					response: { uniqueIdentifier: "text-input" },
				},
			},
			{
				functionResponse: {
					id: "message-call",
					name: "get_text_area_spec",
					response: { uniqueIdentifier: "text-area" },
				},
			},
		]);
		expect(JSON.stringify(contents[2])).not.toContain("SliderConfig");
	});

	it("returns canonical feedback template after one model call", async () => {
		generateMock.mockResolvedValueOnce(
			toolResponse([
				{
					id: "template-call",
					name: "get_template",
					args: { slug: "customer-feedback", useAsIs: true },
				},
			]),
		);

		const response = await POST({
			request: requestFor({ prompt: "Give me Customer Feedback template" }),
		});

		expect(response.status).toBe(200);
		const body: GeneratedBody = await response.json();
		expect(body.title).toBe("Customer Feedback");
		expect(body.submitButtonText).toBe("Submit feedback");
		const fields = getOrderedFormFields(body.fields);
		expect(fields).toHaveLength(4);
		expect(
			fields.find((field) => field.uniqueIdentifier === "slider"),
		).toMatchObject({ min: 0, max: 10, step: 1, defaultValue: 5 });
		expect(isFormStructure(body.fields)).toBe(true);
		expect(generateMock).toHaveBeenCalledTimes(1);
	});

	it.each([
		["null JSON", null],
		["array JSON", []],
		["missing prompt", {}],
		["numeric prompt", { prompt: 42 }],
		["blank prompt", { prompt: "  " }],
		["oversized prompt", { prompt: "x".repeat(MAX_PROMPT_LENGTH + 1) }],
	])("rejects %s before calling either provider", async (_name, payload) => {
		const response = await POST({ request: requestFor(payload) });
		expect(response.status).toBe(400);
		expect(generateMock).not.toHaveBeenCalled();
		expect(groqMock).not.toHaveBeenCalled();
	});

	it("rejects malformed JSON before calling a provider", async () => {
		const response = await POST({
			request: new Request("http://localhost/api/generatewithai", {
				method: "POST",
				body: "{",
			}),
		});
		expect(response.status).toBe(400);
		expect(generateMock).not.toHaveBeenCalled();
	});

	it.each([
		"missing key",
		"unsupported provider",
	])("reports %s as configuration error", async (failure) => {
		if (failure === "missing key") vi.stubEnv("GEMINI_API_KEY", "");
		else vi.stubEnv("AI_PROVIDER", "unsupported");
		const response = await POST({
			request: requestFor({ prompt: "Feedback form" }),
		});
		expect(response.status).toBe(500);
		expect(generateMock).not.toHaveBeenCalled();
	});

	it("dispatches configured Groq provider with prompt and request signal", async () => {
		vi.stubEnv("AI_PROVIDER", "groq");
		const expected = Response.json({ title: "Groq form" });
		groqMock.mockResolvedValueOnce(expected);
		const request = requestFor({ prompt: "  Contact form  " });
		expect(await POST({ request })).toBe(expected);
		expect(groqMock).toHaveBeenCalledWith("Contact form", request.signal);
		expect(generateMock).not.toHaveBeenCalled();
	});

	it("returns recoverable tool errors before completing a valid form", async () => {
		generateMock
			.mockResolvedValueOnce(
				toolResponse([
					{ id: "unknown", name: "invented_tool", args: {} },
					{ id: "invalid-slug", name: "get_template", args: { slug: 9 } },
				]),
			)
			.mockResolvedValueOnce(
				toolResponse([{ id: "name", name: "get_text_input_spec", args: {} }]),
			)
			.mockResolvedValueOnce(finalResponse(JSON.stringify(feedback)));
		const response = await POST({
			request: requestFor({ prompt: "Name form" }),
		});
		expect(response.status).toBe(200);
		const contents = generateMock.mock.calls[1][0].contents as Content[];
		expect(contents[2].parts).toMatchObject([
			{
				functionResponse: {
					id: "unknown",
					response: { error: expect.any(String) },
				},
			},
			{
				functionResponse: {
					id: "invalid-slug",
					response: { error: expect.any(String) },
				},
			},
		]);
		expect(generateMock).toHaveBeenCalledTimes(3);
	});

	it("bounds repeated tool rounds", async () => {
		generateMock.mockResolvedValue(
			toolResponse([{ id: "name", name: "get_text_input_spec", args: {} }]),
		);
		const response = await POST({
			request: requestFor({ prompt: "Name form" }),
		});
		expect(response.status).toBe(502);
		expect(generateMock).toHaveBeenCalledTimes(MAX_TOOL_TURNS + 1);
	});

	it("returns quota failures as 429", async () => {
		generateMock.mockRejectedValueOnce({ status: 429 });
		const response = await POST({
			request: requestFor({ prompt: "Name form" }),
		});
		expect(response.status).toBe(429);
		await expect(response.json()).resolves.toMatchObject({
			error: "AI quota exceeded, please try again later",
		});
	});

	it("stops before another model call when canceled during first response", async () => {
		const controller = new AbortController();
		generateMock.mockImplementationOnce(async () => {
			controller.abort();
			return toolResponse([
				{ id: "name", name: "get_text_input_spec", args: {} },
			]);
		});
		const response = await POST({
			request: requestFor({ prompt: "Name form" }, controller.signal),
		});
		expect(response.status).toBe(499);
		expect(generateMock).toHaveBeenCalledTimes(1);
		expect(generateMock.mock.calls[0][0].config.abortSignal.aborted).toBe(true);
	});

	it("reports overall deadline without starting another model call", async () => {
		const deadline = new AbortController();
		vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
		generateMock.mockImplementationOnce(async () => {
			deadline.abort(new DOMException("Timed out", "TimeoutError"));
			return toolResponse([
				{ id: "name", name: "get_text_input_spec", args: {} },
			]);
		});
		const response = await POST({
			request: requestFor({ prompt: "Name form" }),
		});
		expect(response.status).toBe(504);
		expect(generateMock).toHaveBeenCalledTimes(1);
		expect(AbortSignal.timeout).toHaveBeenCalledWith(GENERATION_TIMEOUT_MS);
	});

	it("rejects malformed model output as 502", async () => {
		generateMock
			.mockResolvedValueOnce(
				toolResponse([{ id: "name", name: "get_text_input_spec", args: {} }]),
			)
			.mockResolvedValueOnce(finalResponse("not JSON"));
		const response = await POST({
			request: requestFor({ prompt: "Name form" }),
		});
		expect(response.status).toBe(502);
		await expect(response.json()).resolves.toEqual({
			error: "AI returned invalid JSON",
		});
	});
});
