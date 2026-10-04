import { pathToFileURL } from "node:url";
import {
	FIELD_TOOL_SPECS,
	GET_FIELD_SPEC_TOOLS,
	GET_TEMPLATE_TOOLS,
	resolveFieldSpec,
	resolveTemplateList,
	SYSTEM_PROMPT,
} from "#/routes/api/generatewithai/-prompt";

/**
 * Inspect the current generation context without creating a second prompt.
 * This complete snapshot is for developers; requests fetch only needed specs.
 */
export function generatePrompt() {
	const tools = [...GET_FIELD_SPEC_TOOLS, ...GET_TEMPLATE_TOOLS];
	return {
		systemPrompt: SYSTEM_PROMPT,
		tools,
		fieldSpecs: Object.fromEntries(
			Object.values(FIELD_TOOL_SPECS).map((field) => [
				field.toolName,
				resolveFieldSpec(field.toolName),
			]),
		),
		templates: resolveTemplateList().templates,
		sizes: {
			systemPromptCharacters: SYSTEM_PROMPT.length,
			toolDeclarationCharacters: JSON.stringify(tools).length,
		},
	};
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	process.stdout.write(`${JSON.stringify(generatePrompt(), null, 2)}\n`);
}
