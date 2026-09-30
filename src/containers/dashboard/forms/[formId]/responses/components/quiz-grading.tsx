import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	isFileUploadReceipt,
	isFileUploadReceiptList,
} from "@/features/file-uploads/types";
import type { FieldConfig } from "@/features/form-builder/elements";
import {
	getQuizGradeRelease,
	hasQuizAnswerKey,
	type QuizSettings,
} from "@/features/form-builder/form-structure";
import type { QuizResult } from "@/features/form-builder/utils/quiz";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FormResponse {
	id: string;
	data: Record<string, unknown>;
	createdAt: string;
	formsId: string;
}

export function getQuizResult(
	data: Record<string, unknown>,
): QuizResult | null {
	const quiz = data.__quiz;
	if (!quiz || typeof quiz !== "object") return null;
	const result = quiz as Partial<QuizResult>;
	return typeof result.score === "number" && typeof result.maxScore === "number"
		? {
				manualScores:
					typeof result.manualScores === "object" && result.manualScores
						? (result.manualScores as Record<string, number>)
						: {},
				pendingPoints:
					typeof result.pendingPoints === "number" ? result.pendingPoints : 0,
				releaseInvalidatedAt:
					typeof result.releaseInvalidatedAt === "string"
						? result.releaseInvalidatedAt
						: undefined,
				releasedAt:
					typeof result.releasedAt === "string" ? result.releasedAt : undefined,
				score: result.score,
				maxScore: result.maxScore,
			}
		: null;
}

export function responseFields(data: Record<string, unknown>) {
	return Object.entries(data).filter(([key]) => key !== "__quiz");
}

export function formatResponseValue(value: unknown): string {
	if (isFileUploadReceipt(value)) return value.name;
	if (Array.isArray(value)) return value.map(formatResponseValue).join(", ");
	if (typeof value === "boolean") return value ? "Yes" : "No";
	return String(value);
}

export function ResponseDetailsDrawer({
	response,
	formId,
	manualQuizFields,
	onResponseUpdated,
	quizSettings,
}: {
	response: FormResponse;
	formId: string;
	manualQuizFields: FieldConfig[];
	onResponseUpdated: (response: FormResponse) => void;
	quizSettings: QuizSettings | undefined;
}) {
	const isMobile = useIsMobile();
	const quizResult = getQuizResult(response.data);
	const [manualScores, setManualScores] = React.useState<
		Record<string, string>
	>({});
	const [isSavingGrade, setIsSavingGrade] = React.useState(false);
	const [isReleasingGrade, setIsReleasingGrade] = React.useState(false);
	const isReleased = Boolean(quizResult?.releasedAt);
	const manualScoreDefaults = Object.fromEntries(
		manualQuizFields.map((field) => [
			field.id,
			quizResult?.manualScores[field.id]?.toString() ?? "",
		]),
	);
	const manualScoreDefaultsKey = JSON.stringify(manualScoreDefaults);

	React.useEffect(() => {
		setManualScores(
			JSON.parse(manualScoreDefaultsKey) as Record<string, string>,
		);
	}, [response.id, manualScoreDefaultsKey]);

	const saveGrade = async () => {
		const scores = Object.fromEntries(
			Object.entries(manualScores).flatMap(([fieldId, score]) => [
				[fieldId, score === "" ? null : Number(score)],
			]),
		) as Record<string, number | null>;
		if (
			Object.values(scores).some(
				(score) => score !== null && !Number.isFinite(score),
			)
		)
			return;

		setIsSavingGrade(true);
		try {
			const gradeResponse = await fetch(`/api/forms/${formId}/responses`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ responseId: response.id, manualScores: scores }),
			});
			if (!gradeResponse.ok) throw new Error("Failed to save grade");
			onResponseUpdated((await gradeResponse.json()) as FormResponse);
			toast.success("Grade saved");
		} catch {
			toast.error("Failed to save grade");
		} finally {
			setIsSavingGrade(false);
		}
	};

	const releaseGrade = async () => {
		setIsReleasingGrade(true);
		try {
			const releaseResponse = await fetch(`/api/forms/${formId}/responses`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ responseId: response.id, release: true }),
			});
			const result = (await releaseResponse.json()) as
				| FormResponse
				| { error?: string };
			if (!releaseResponse.ok) {
				throw new Error(
					"error" in result ? result.error : "Failed to release grade",
				);
			}
			onResponseUpdated(result as FormResponse);
			toast.success("Grade released by email");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to release grade",
			);
		} finally {
			setIsReleasingGrade(false);
		}
	};

	const formatFieldName = (fieldName: string) => {
		return fieldName
			.replace(/_\d+$/, "")
			.replace(/_/g, " ")
			.replace(/\b\w/g, (letter) => letter.toUpperCase());
	};

	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button
					variant="link"
					className="text-foreground w-fit px-0 text-left cursor-pointer"
				>
					#{response.id}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>Response Details</DrawerTitle>
					<DrawerDescription>
						Submitted on{" "}
						{new Date(response.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<div className="grid gap-4">
						{responseFields(response.data).map(([key, value]) => (
							<div key={key} className="flex flex-col gap-2">
								<Label className="text-sm font-medium">
									{formatFieldName(key)}
								</Label>
								{isFileUploadReceiptList(value) ? (
									<div className="flex flex-wrap gap-2">
										{value.map((file) => (
											<Button key={file.id} asChild size="sm" variant="outline">
												<a href={`/api/forms/${formId}/uploads/${file.id}`}>
													{file.name}
												</a>
											</Button>
										))}
									</div>
								) : (
									<input
										type="text"
										value={formatResponseValue(value)}
										disabled
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								)}
							</div>
						))}
					</div>
					{quizResult ? (
						<div className="flex flex-col gap-3 rounded-lg border p-4">
							<div className="flex flex-col gap-1">
								<Label>Quiz score</Label>
								<p className="text-xs text-muted-foreground">
									{quizResult.pendingPoints
										? `Automatic score: ${quizResult.score} / ${quizResult.maxScore}. ${quizResult.pendingPoints} point(s) still need review.`
										: `Score: ${quizResult.score} / ${quizResult.maxScore}`}
								</p>
							</div>
							{getQuizGradeRelease(quizSettings) === "after-review" ? (
								quizResult.releasedAt ? (
									<p className="text-xs text-muted-foreground">
										Released {new Date(quizResult.releasedAt).toLocaleString()}.
									</p>
								) : quizResult.releaseInvalidatedAt ? (
									<p className="text-xs text-muted-foreground">
										Score changed after release. Send updated grade when ready.
									</p>
								) : quizSettings?.recipientEmailFieldId ? (
									<Button
										type="button"
										onClick={() => void releaseGrade()}
										disabled={isReleasingGrade || quizResult.pendingPoints > 0}
									>
										{isReleasingGrade ? "Releasing…" : "Release grade & email"}
									</Button>
								) : (
									<p className="text-xs text-muted-foreground">
										Select an email question in Quiz settings to release this
										grade.
									</p>
								)
							) : null}
						</div>
					) : null}
					{manualQuizFields.length ? (
						<div className="flex flex-col gap-4 rounded-lg border p-4">
							<div className="flex flex-col gap-1">
								<Label>Manual grading</Label>
								<p className="text-xs text-muted-foreground">
									{isReleased
										? "Grade released. Editing is locked."
										: quizResult?.pendingPoints
											? `${quizResult.pendingPoints} point(s) still need review.`
											: `Score: ${quizResult?.score ?? 0} / ${quizResult?.maxScore ?? 0}`}
								</p>
							</div>
							{manualQuizFields.map((field) => (
								<div
									key={field.id}
									className="flex items-center justify-between gap-4"
								>
									<Label
										htmlFor={`score-${response.id}-${field.id}`}
										className="min-w-0 flex-1 truncate"
									>
										{field.label} ({field.quiz?.points} points)
									</Label>
									<Input
										id={`score-${response.id}-${field.id}`}
										type="number"
										min="0"
										max={field.quiz?.points}
										className="w-24"
										disabled={isReleased}
										value={manualScores[field.id] ?? ""}
										onChange={(event) =>
											setManualScores((scores) => ({
												...scores,
												[field.id]: event.target.value,
											}))
										}
									/>
								</div>
							))}
							<Button
								type="button"
								onClick={() => void saveGrade()}
								disabled={isSavingGrade || isReleased}
							>
								{isSavingGrade ? "Saving…" : "Save grade"}
							</Button>
						</div>
					) : null}
				</div>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function QuestionGrading({
	responses,
	formId,
	quizFields,
	onResponseUpdated,
}: {
	responses: FormResponse[];
	formId: string;
	quizFields: FieldConfig[];
	onResponseUpdated: (response: FormResponse) => void;
}) {
	const questionIds = quizFields.map((field) => field.id).join("|");
	const firstQuestionId = quizFields[0]?.id ?? "";
	const [selectedQuestionId, setSelectedQuestionId] =
		React.useState(firstQuestionId);
	const [scoreDrafts, setScoreDrafts] = React.useState<Record<string, string>>(
		{},
	);
	const [savingResponseId, setSavingResponseId] = React.useState<string | null>(
		null,
	);

	React.useEffect(() => {
		setSelectedQuestionId((current) =>
			questionIds.split("|").includes(current) ? current : firstQuestionId,
		);
	}, [firstQuestionId, questionIds]);

	const selectedField = quizFields.find(
		(field) => field.id === selectedQuestionId,
	);
	if (!selectedField) return null;
	const isManualQuestion = !hasQuizAnswerKey(selectedField);

	const saveScore = async (response: FormResponse) => {
		const draftKey = `${selectedField.id}:${response.id}`;
		const savedScore = getQuizResult(response.data)?.manualScores[
			selectedField.id
		];
		const rawScore = scoreDrafts[draftKey] ?? savedScore?.toString() ?? "";
		if (rawScore === "") {
			toast.error(`Enter a score from 0 to ${selectedField.quiz!.points}`);
			return;
		}
		const score = Number(rawScore);
		if (
			!Number.isFinite(score) ||
			score < 0 ||
			score > selectedField.quiz!.points
		) {
			toast.error(`Enter a score from 0 to ${selectedField.quiz!.points}`);
			return;
		}

		setSavingResponseId(response.id);
		try {
			const gradeResponse = await fetch(`/api/forms/${formId}/responses`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					responseId: response.id,
					manualScores: { [selectedField.id]: score },
				}),
			});
			if (!gradeResponse.ok) throw new Error("Failed to save grade");
			onResponseUpdated((await gradeResponse.json()) as FormResponse);
			toast.success("Grade saved");
		} catch {
			toast.error("Failed to save grade");
		} finally {
			setSavingResponseId(null);
		}
	};

	return (
		<div className="flex flex-col gap-4 px-4 lg:px-6">
			<div className="flex flex-col gap-2 sm:max-w-md">
				<Label htmlFor="question-grading-select">Question</Label>
				<Select
					value={selectedQuestionId}
					onValueChange={setSelectedQuestionId}
				>
					<SelectTrigger id="question-grading-select">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{quizFields.map((field) => (
							<SelectItem key={field.id} value={field.id}>
								{field.label} ({field.quiz?.points} points)
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<p className="text-sm text-muted-foreground">
				{isManualQuestion
					? "Grade every response for this question in one place."
					: "Review every response for this automatically scored question in one place."}
			</p>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead>Response</TableHead>
							<TableHead>Answer</TableHead>
							<TableHead className="w-44">
								{isManualQuestion ? "Score" : "Grading"}
							</TableHead>
							<TableHead className="w-28" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{responses.map((response) => {
							const quizResult = getQuizResult(response.data);
							const draftKey = `${selectedField.id}:${response.id}`;
							const savedScore = quizResult?.manualScores[selectedField.id];
							const value =
								scoreDrafts[draftKey] ?? savedScore?.toString() ?? "";
							const isReleased = Boolean(quizResult?.releasedAt);

							return (
								<TableRow key={response.id}>
									<TableCell className="font-medium">#{response.id}</TableCell>
									<TableCell className="max-w-md whitespace-pre-wrap">
										{response.data[selectedField.id] === undefined
											? "No response"
											: formatResponseValue(response.data[selectedField.id])}
									</TableCell>
									<TableCell>
										{isManualQuestion ? (
											<Input
												aria-label={`Score for response ${response.id}`}
												type="number"
												min="0"
												max={selectedField.quiz!.points}
												disabled={isReleased}
												value={value}
												onChange={(event) =>
													setScoreDrafts((drafts) => ({
														...drafts,
														[draftKey]: event.target.value,
													}))
												}
											/>
										) : (
											"Automatically scored"
										)}
									</TableCell>
									<TableCell>
										{isManualQuestion ? (
											<Button
												type="button"
												size="sm"
												onClick={() => void saveScore(response)}
												disabled={
													savingResponseId === response.id || isReleased
												}
											>
												{isReleased
													? "Released"
													: savingResponseId === response.id
														? "Saving…"
														: "Save"}
											</Button>
										) : null}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
