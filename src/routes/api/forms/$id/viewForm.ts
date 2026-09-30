import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import {
	isFormStructure,
	stripQuizAnswerKeys,
} from "@/features/form-builder/form-structure";
import { getFormStatus } from "../-utils";

export const Route = createFileRoute("/api/forms/$id/viewForm")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				try {
					// Fetch form with user authorization check
					const form = await prisma.forms.findUnique({
						where: {
							id: params.id,
						},
						include: {
							_count: {
								select: {
									responses: true,
								},
							},
						},
					});

					if (!form) {
						return Response.json({ error: "Form not found" }, { status: 404 });
					}

					if (!isFormStructure(form.fields)) {
						return Response.json(
							{ error: "Form is unavailable" },
							{ status: 422 },
						);
					}

					// Calculate status using _count but exclude it from response
					const status = getFormStatus(
						form._count.responses,
						form.maxSubmissions,
						form.expiresAt ? form.expiresAt.toISOString() : null,
					);

					// Destructure to exclude _count from the response (users shouldn't see internal response count)
					// and userId (form owners stay private on the public endpoint)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { _count, userId, ...formWithoutCount } = form;

					// Add status to form response (without _count)
					const formWithStatus = {
						...formWithoutCount,
						fields: stripQuizAnswerKeys(form.fields),
						status,
					};

					return Response.json(formWithStatus);
				} catch (error) {
					// Unknown errors
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
