/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import type { FieldConfig } from "@/features/form-builder/elements";
import { FIELD_REGISTRY } from "@/features/form-builder/elements";

export const generateZodSchema = (fields: FieldConfig[]): z.ZodObject<any> => {
	const schemaObject: Record<string, z.ZodTypeAny> = {};

	fields.forEach((field) => {
		const registry = FIELD_REGISTRY[field.uniqueIdentifier];
		if (registry?.getValidationSchema) {
			schemaObject[field.id] = registry.getValidationSchema(field as any);
		}
	});

	return z.object(schemaObject);
};
