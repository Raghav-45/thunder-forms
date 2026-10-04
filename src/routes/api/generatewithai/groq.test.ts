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
} from "#/routes/api/generatewithai/-generation";
import {
	buildGroqTools,
	runGroqGeneration,
} from "#/routes/api/generatewithai/-groq";
import {
	GET_FIELD_SPEC_TOOLS,
	GET_TEMPLATE_TOOLS,
	MAX_TOOL_TURNS,
} from "#/routes/api/generatewithai/-prompt";

const { createMock, clientMock } = vi.hoisted(() => {
	const createMock = vi.fn();
	return {
		createMock,
		clientMock: vi.fn(
			class {
				chat = { completions: { create: createMock } };
			},
		),
	};
});

vi.mock("groq-sdk", () => ({ default: clientMock }));

type GeneratedBody = GeneratedForm & {
	meta: { usage: GenerationUsage };
};

function toolCall(name: string, args: unknown = {}, id = "call_1") {
	return {
		id,
		type: "function" as const,
		function: { name, arguments: JSON.stringify(args) },
	};
}

function toolCompletion(...calls: ReturnType<typeof toolCall>[]) {
	return {
		choices: [
			{ message: { role: "assistant", content: null, tool_calls: calls } },
		],
	};
}

const finalCompletion = (text: string) => ({
	choices: [{ message: { role: "assistant", content: text } }],
});

const feedback = {
	title: "Feedback",
	description: "Share feedback.",
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

describe("Groq form generation", () => {
	beforeEach(() => {
		createMock.mockReset();
		clientMock.mockClear();
		vi.stubEnv("GROQ_API_KEY", "test-key");
		vi.stubEnv("NODE_ENV", "production");
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("reshapes every declaration into unique OpenAI function tools", () => {
		const tools = buildGroqTools();
		expect(tools).toHaveLength(
			GET_FIELD_SPEC_TOOLS.length + GET_TEMPLATE_TOOLS.length,
		);
		const definitions = tools.flatMap((tool) =>
			tool.function ? [tool.function] : [],
		);
		expect(definitions).toHaveLength(tools.length);
		expect(new Set(definitions.map((definition) => definition.name)).size).toBe(
			tools.length,
		);
		for (const tool of tools) expect(tool.type).toBe("function");
		for (const definition of definitions)
			expect(definition.name.length).toBeGreaterThan(0);
	});

	it("keeps template slug required and emits lowercase schema types", () => {
		const definitions = buildGroqTools().flatMap((tool) =>
			tool.function ? [tool.function] : [],
		);
		expect(
			definitions.find((definition) => definition.name === "get_template")
				?.parameters,
		).toMatchObject({
			type: "object",
			properties: { slug: { type: "string" }, useAsIs: { type: "boolean" } },
			required: ["slug"],
		});
		expect(
			definitions.find((definition) => definition.name === "list_templates")
				?.parameters,
		).toBeUndefined();
	});

	it("batches needed specs, enforces first tools, bounds output, and sums usage", async () => {
		createMock
			.mockResolvedValueOnce({
				...toolCompletion(
					toolCall("get_text_input_spec", {}, "name"),
					toolCall("get_text_area_spec", {}, "message"),
				),
				usage: { prompt_tokens: 120, completion_tokens: 20 },
			})
			.mockResolvedValueOnce({
				...finalCompletion(JSON.stringify(feedback)),
				usage: { prompt_tokens: 240, completion_tokens: 65 },
			});

		const response = await runGroqGeneration(
			"Basic feedback with name and message",
		);

		expect(response.status).toBe(200);
		const body: GeneratedBody = await response.json();
		expect(isFormStructure(body.fields)).toBe(true);
		expect(getOrderedFormFields(body.fields)).toMatchObject(
			feedback.fields.pages[0].sections[0].fields,
		);
		expect(body.meta.usage).toEqual({ inputTokens: 360, outputTokens: 85 });
		expect(createMock).toHaveBeenCalledTimes(2);
		expect(createMock.mock.calls[0][0]).toMatchObject({
			tool_choice: "required",
			max_completion_tokens: MAX_OUTPUT_TOKENS,
		});
		expect(createMock.mock.calls[1][0].tool_choice).toBe("auto");
		expect(createMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
		expect(clientMock).toHaveBeenCalledWith({
			apiKey: "test-key",
			maxRetries: 0,
			timeout: GENERATION_TIMEOUT_MS,
		});
		const messages = createMock.mock.calls[1][0].messages as {
			role: string;
			tool_call_id?: string;
			content: string;
		}[];
		const replies = messages.filter((message) => message.role === "tool");
		expect(replies.map((message) => message.tool_call_id)).toEqual([
			"name",
			"message",
		]);
		expect(
			replies.map((message) => JSON.parse(message.content).uniqueIdentifier),
		).toEqual(["text-input", "text-area"]);
		expect(JSON.stringify(replies)).not.toContain("SliderConfig");
	});

	it("returns canonical template after one model call", async () => {
		createMock.mockResolvedValueOnce(
			toolCompletion(
				toolCall("get_template", { slug: "customer-feedback", useAsIs: true }),
			),
		);
		const response = await runGroqGeneration(
			"Give me Customer Feedback template",
		);
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
		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it("extends fetched template with seven additions without model rewriting base fields", async () => {
		const additions = Array.from({ length: 7 }, (_, index) => ({
			uniqueIdentifier: "text-input",
			label: `Extra ${index + 1}`,
		}));
		createMock
			.mockResolvedValueOnce(
				toolCompletion(
					toolCall(
						"get_template",
						{ slug: "contact-us", useAsIs: false },
						"template",
					),
					toolCall("get_text_input_spec", {}, "text"),
				),
			)
			.mockResolvedValueOnce(
				finalCompletion(
					JSON.stringify({
						templateSlug: "contact-us",
						fields: {
							pages: [
								{
									title: "Additional questions",
									sections: [{ fields: additions }],
								},
							],
						},
					}),
				),
			);
		const response = await runGroqGeneration(
			"Use Contact Us template and add seven more text fields",
		);
		expect(response.status).toBe(200);
		const body: GeneratedBody = await response.json();
		expect(body.title).toBe("Contact Us");
		expect(body.submitButtonText).toBe("Send message");
		const fields = getOrderedFormFields(body.fields);
		expect(fields.map((field) => field.label)).toEqual([
			"Full name",
			"Email address",
			"Subject",
			"Message",
			...additions.map((field) => field.label),
		]);
		expect(new Set(fields.map((field) => field.id)).size).toBe(11);
		expect(isFormStructure(body.fields)).toBe(true);
		expect(createMock).toHaveBeenCalledTimes(2);
	});

	it("recovers from unknown tool and malformed template arguments", async () => {
		const malformed = toolCall("get_template", {}, "template");
		malformed.function.arguments = "{";
		createMock
			.mockResolvedValueOnce(
				toolCompletion(toolCall("invented_tool", {}, "unknown"), malformed),
			)
			.mockResolvedValueOnce(toolCompletion(toolCall("get_text_input_spec")))
			.mockResolvedValueOnce(finalCompletion(JSON.stringify(feedback)));
		const response = await runGroqGeneration("Name form");
		expect(response.status).toBe(200);
		const messages = createMock.mock.calls[1][0].messages as {
			role: string;
			content: string;
		}[];
		const replies = messages.filter((message) => message.role === "tool");
		expect(JSON.parse(replies[0].content)).toMatchObject({
			error: "Unknown tool: invented_tool",
		});
		expect(JSON.parse(replies[1].content)).toMatchObject({
			error: expect.stringContaining("Unknown template"),
		});
		expect(createMock).toHaveBeenCalledTimes(3);
	});

	it("bounds repeated tools and rejects first-turn chatter without retries", async () => {
		createMock.mockResolvedValue(
			toolCompletion(toolCall("get_text_input_spec")),
		);
		const bounded = await runGroqGeneration("Name form");
		expect(bounded.status).toBe(502);
		expect(createMock).toHaveBeenCalledTimes(MAX_TOOL_TURNS + 1);
		createMock
			.mockReset()
			.mockResolvedValueOnce(finalCompletion("Which fields do you want?"));
		const chatter = await runGroqGeneration("Name form");
		expect(chatter.status).toBe(502);
		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it("does not call upstream without provider key", async () => {
		vi.stubEnv("GROQ_API_KEY", "");
		const response = await runGroqGeneration("Name form");
		expect(response.status).toBe(500);
		expect(clientMock).not.toHaveBeenCalled();
		expect(createMock).not.toHaveBeenCalled();
	});

	it("returns upstream quota failures as 429", async () => {
		createMock.mockRejectedValueOnce({ status: 429 });
		const response = await runGroqGeneration("Name form");
		expect(response.status).toBe(429);
		await expect(response.json()).resolves.toMatchObject({
			error: "AI quota exceeded, please try again later",
		});
	});

	it("stops subsequent model calls after request cancellation", async () => {
		const controller = new AbortController();
		createMock.mockImplementationOnce(async () => {
			controller.abort();
			return toolCompletion(toolCall("get_text_input_spec"));
		});
		const response = await runGroqGeneration("Name form", controller.signal);
		expect(response.status).toBe(499);
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(createMock.mock.calls[0][1].signal.aborted).toBe(true);
	});

	it("returns bad payload only in development", async () => {
		for (const environment of ["development", "production"]) {
			vi.stubEnv("NODE_ENV", environment);
			createMock
				.mockResolvedValueOnce(toolCompletion(toolCall("get_text_input_spec")))
				.mockResolvedValueOnce(finalCompletion("not JSON"));
			const response = await runGroqGeneration("Name form");
			expect(response.status).toBe(502);
			const body = await response.json();
			expect(body.error).toBe("AI returned invalid JSON");
			if (environment === "development") expect(body.raw).toBe("not JSON");
			else expect(body).not.toHaveProperty("raw");
		}
	});
});
