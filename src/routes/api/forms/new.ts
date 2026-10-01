import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v3";
import { prisma } from "#/db";
import { isFormStructure } from "#/features/form-builder/form-structure";
import type { Prisma } from "#/generated/prisma/client";
import { getSessionUserId } from "#/lib/server/session";
import { FormValidator } from "#/lib/validators/form";

export const Route = createFileRoute("/api/forms/new")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const userId = await getSessionUserId(request);
					if (!userId) {
						return Response.json({ error: "Unauthorized" }, { status: 401 });
					}

					const payload = FormValidator.parse(await request.json());
					if (!isFormStructure(payload.fields)) {
						return Response.json(
							{ success: false, error: "Invalid form structure" },
							{ status: 422 },
						);
					}

					const form = await prisma.forms.create({
						data: {
							...payload,
							fields: payload.fields as unknown as Prisma.InputJsonValue,
							userId,
						},
					});

					return Response.json({ success: true, id: form.id }, { status: 201 });
				} catch (error) {
					if (error instanceof z.ZodError) {
						return Response.json(
							{
								success: false,
								error: "Validation error",
								issues: error.issues.map((issue) => ({
									field: issue.path.join("."),
									message: issue.message,
								})),
							},
							{ status: 422 },
						);
					}

					console.error("Error creating form:", error);
					return Response.json(
						{
							success: false,
							error: "Internal server error",
							message:
								process.env.NODE_ENV === "development" && error instanceof Error
									? error.message
									: undefined,
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});
