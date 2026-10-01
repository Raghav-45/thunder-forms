import { GraduationCap, Link, Settings, Shield, Split } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "#/components/ui/sidebar";
import { Switch } from "#/components/ui/switch";
import { DatePickerWithPresets } from "#/features/form-builder/components/date-picker-with-presets";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	type FormStructure,
	getOrderedFormFields,
	getQuizDefaultPoints,
	getQuizGradeRelease,
	isAutoGradableQuizField,
	type QuizSettings,
} from "#/features/form-builder/form-structure";
import { useFormStore } from "#/features/form-builder/store";
import type { QuizQuestionConfig } from "#/features/form-builder/types";
import { enableGooglePickerPointerEvents } from "#/features/google-picker/client";
import { GoogleSheetsIntegration } from "#/features/google-sheets/components/google-sheets-integration";

const data = {
	nav: [
		{ name: "Access & Control", icon: Shield },
		{ name: "Quiz", icon: GraduationCap },
		{ name: "Navigation", icon: Split },
		{ name: "Appearance", icon: Settings },
		{ name: "Integrations", icon: Link },
	],
};

function choiceOptions(field: FieldConfig) {
	const options = (field as { options?: unknown }).options;
	if (!Array.isArray(options)) return [];

	return options.flatMap((option) =>
		option &&
		typeof option === "object" &&
		typeof (option as { value?: unknown }).value === "string" &&
		typeof (option as { label?: unknown }).label === "string"
			? [
					{
						label: (option as { label: string }).label,
						value: (option as { value: string }).value,
						disabled: (option as { disabled?: boolean }).disabled === true,
					},
				].filter((option) => !option.disabled)
			: [],
	);
}

interface SettingsDialogProps {
	formId: string | null;
	formStructure: FormStructure;
	onQuizSettingsChange: (settings: QuizSettings | undefined) => void;
	onQuizQuestionChange: (
		fieldId: string,
		config: QuizQuestionConfig | undefined,
	) => void;
}

export function SettingsDialog({
	formId,
	formStructure,
	onQuizSettingsChange,
	onQuizQuestionChange,
}: SettingsDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState("Access & Control");
	const [googlePickerOpen, setGooglePickerOpen] = React.useState(false);
	const { formSettings, setFormSettings } = useFormStore();
	const quizSettings = formStructure.quiz;
	const quizFields = getOrderedFormFields(formStructure);
	const emailFields = quizFields.filter(
		(field) =>
			field.uniqueIdentifier === "text-input" &&
			(field as { inputType?: string }).inputType === "email",
	);
	const updateQuizSettings = (changes: Partial<QuizSettings>) => {
		if (!quizSettings) return;
		onQuizSettingsChange({ ...quizSettings, ...changes });
	};

	const updateQuizQuestion = (
		field: FieldConfig,
		correctAnswers: string[],
		points: number,
	) => {
		onQuizQuestionChange(field.id, {
			...(correctAnswers.length ? { correctAnswers } : {}),
			points,
		});
	};

	React.useEffect(() => {
		if (!googlePickerOpen) return;
		return enableGooglePickerPointerEvents();
	}, [googlePickerOpen]);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) setGooglePickerOpen(false);
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full mt-2 font-medium">
					<Settings className="mr-2 h-4 w-4" />
					Advanced Settings
				</Button>
			</DialogTrigger>
			<DialogContent
				className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px]"
				overlayClassName="bg-black/60 backdrop-blur-md"
				onEscapeKeyDown={
					googlePickerOpen ? (event) => event.preventDefault() : undefined
				}
				onFocusOutside={
					googlePickerOpen ? (event) => event.preventDefault() : undefined
				}
				onInteractOutside={
					googlePickerOpen ? (event) => event.preventDefault() : undefined
				}
			>
				<DialogTitle className="sr-only">Settings</DialogTitle>
				<DialogDescription className="sr-only">
					Customize your form settings here.
				</DialogDescription>
				<SidebarProvider className="items-start">
					<Sidebar
						collapsible="none"
						className="hidden md:flex w-60 border-r bg-muted/30"
					>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										{data.nav.map((item) => (
											<SidebarMenuItem key={item.name}>
												<SidebarMenuButton
													isActive={activeTab === item.name}
													onClick={() => setActiveTab(item.name)}
													className="h-10"
												>
													<item.icon className="h-4 w-4" />
													<span className="font-medium">{item.name}</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
					<main className="flex h-[550px] flex-1 flex-col overflow-hidden bg-background">
						<div className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
							{data.nav.map((item) => (
								<Button
									key={item.name}
									type="button"
									variant={activeTab === item.name ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setActiveTab(item.name)}
									className="shrink-0"
								>
									<item.icon className="mr-1.5 h-4 w-4" />
									{item.name}
								</Button>
							))}
						</div>
						<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
							{/* --- Access & Control --- */}
							{activeTab === "Access & Control" && (
								<div className="space-y-6">
									<div className="flex flex-col gap-1">
										<h1 className="text-2xl font-bold">Access & Control</h1>
										<p className="text-muted-foreground text-sm">
											Manage form access, expiration, and submission limits.
										</p>
									</div>

									<div className="grid gap-6">
										<div className="grid gap-2">
											<Label htmlFor="expiresAt">Expiration Date</Label>
											<DatePickerWithPresets
												date={formSettings.expiresAt || null}
												setDate={(e) =>
													setFormSettings({
														...formSettings,
														expiresAt: e || undefined,
													})
												}
											/>
											<p className="text-xs text-muted-foreground">
												The form will automatically close on this date.
											</p>
										</div>

										<div className="grid gap-2">
											<Label htmlFor="maxSubmission">
												Max Submission Limit
											</Label>
											<Input
												id="maxSubmission"
												type="number"
												placeholder="Unlimited"
												value={formSettings.maxSubmissions || ""}
												onChange={(e) =>
													setFormSettings({
														...formSettings,
														maxSubmissions: e.target.value
															? parseInt(e.target.value)
															: undefined,
													})
												}
											/>
											<p className="text-xs text-muted-foreground">
												Limit total responses. Leave empty for unlimited.
											</p>
										</div>
									</div>
								</div>
							)}

							{activeTab === "Quiz" && (
								<div className="space-y-6">
									<div className="flex flex-col gap-1">
										<h1 className="text-2xl font-bold">Quiz</h1>
										<p className="text-muted-foreground text-sm">
											Set answer keys and points. Automatic scores show after
											submission; manual scores need review.
										</p>
									</div>

									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="flex flex-col gap-1">
											<Label htmlFor="quiz-enabled">Make this a quiz</Label>
											<p className="text-xs text-muted-foreground">
												Automatically score questions with an answer key.
											</p>
										</div>
										<Switch
											id="quiz-enabled"
											checked={quizSettings?.enabled ?? false}
											onCheckedChange={(enabled) =>
												onQuizSettingsChange(
													enabled
														? {
																defaultPoints: 1,
																enabled: true,
																gradeRelease: "immediately",
															}
														: undefined,
												)
											}
										/>
									</div>

									{quizSettings?.enabled ? (
										<>
											<div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
												<div className="flex flex-col gap-2">
													<Label htmlFor="quiz-grade-release">
														Grade release
													</Label>
													<Select
														value={getQuizGradeRelease(quizSettings)}
														onValueChange={(
															gradeRelease: "immediately" | "after-review",
														) =>
															updateQuizSettings({
																gradeRelease,
																...(gradeRelease === "immediately"
																	? { recipientEmailFieldId: undefined }
																	: {}),
															})
														}
													>
														<SelectTrigger id="quiz-grade-release">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="immediately">
																Immediately after submission
															</SelectItem>
															<SelectItem value="after-review">
																Later, after manual review
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="flex flex-col gap-2">
													<Label htmlFor="quiz-default-points">
														Default points for new questions
													</Label>
													<Input
														id="quiz-default-points"
														type="number"
														min="1"
														value={getQuizDefaultPoints(quizSettings)}
														onChange={(event) =>
															updateQuizSettings({
																defaultPoints: Math.max(
																	1,
																	Number(event.target.value) || 1,
																),
															})
														}
													/>
												</div>
												{getQuizGradeRelease(quizSettings) ===
												"after-review" ? (
													<div className="flex flex-col gap-2 sm:col-span-2">
														<Label htmlFor="quiz-recipient-email">
															Grade recipient email question
														</Label>
														{emailFields.length ? (
															<Select
																value={
																	quizSettings.recipientEmailFieldId ?? "__none"
																}
																onValueChange={(recipientEmailFieldId) =>
																	updateQuizSettings({
																		recipientEmailFieldId:
																			recipientEmailFieldId === "__none"
																				? undefined
																				: recipientEmailFieldId,
																	})
																}
															>
																<SelectTrigger id="quiz-recipient-email">
																	<SelectValue placeholder="Select an email question" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="__none">
																		Do not send grade email
																	</SelectItem>
																	{emailFields.map((field) => (
																		<SelectItem key={field.id} value={field.id}>
																			{field.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														) : (
															<p className="text-sm text-muted-foreground">
																Add an Email text question to send released
																grades.
															</p>
														)}
													</div>
												) : null}
											</div>

											{quizFields.length ? (
												<div className="flex flex-col gap-4">
													<div className="flex flex-col gap-1">
														<h2 className="font-medium">Question scoring</h2>
														<p className="text-sm text-muted-foreground">
															Set answer keys for supported questions. Grade
															other question types from Responses.
														</p>
													</div>
													{quizFields.map((field) => {
														const options = choiceOptions(field);
														const quiz = field.quiz;
														const correctAnswers = quiz?.correctAnswers ?? [];
														const points =
															quiz?.points ??
															getQuizDefaultPoints(quizSettings);
														const isMultipleAnswer =
															field.uniqueIdentifier === "multi-select";
														const isRecipientEmail =
															field.id === quizSettings.recipientEmailFieldId;
														const canAutoGrade =
															!isRecipientEmail &&
															isAutoGradableQuizField(field);
														const isTextAnswer =
															field.uniqueIdentifier === "text-input";

														return (
															<div
																key={field.id}
																className="rounded-lg border p-4"
															>
																<div className="flex flex-col gap-4">
																	<div className="flex flex-col gap-1">
																		<Label>{field.label}</Label>
																		<p className="text-xs text-muted-foreground">
																			{isRecipientEmail
																				? "Used to send released grades. This question is not scored."
																				: !canAutoGrade
																					? "Manual grading required after students submit."
																					: isTextAnswer
																						? "Add accepted short answers, separated by commas."
																						: isMultipleAnswer
																							? "Select every correct answer."
																							: "Select the correct answer."}
																		</p>
																	</div>
																	{canAutoGrade ? (
																		<div className="flex flex-col gap-2">
																			{isTextAnswer ? (
																				<Input
																					value={correctAnswers.join(", ")}
																					onChange={(event) =>
																						updateQuizQuestion(
																							field,
																							event.target.value
																								.split(",")
																								.map((answer) => answer.trim())
																								.filter(Boolean),
																							points,
																						)
																					}
																					placeholder="Example: mitochondria, mitochondrion"
																				/>
																			) : isMultipleAnswer ? (
																				options.map((option) => (
																					<div
																						key={option.value}
																						className="flex items-center gap-2"
																					>
																						<Checkbox
																							id={`${field.id}-${option.value}`}
																							checked={correctAnswers.includes(
																								option.value,
																							)}
																							onCheckedChange={(checked) =>
																								updateQuizQuestion(
																									field,
																									checked
																										? [
																												...correctAnswers,
																												option.value,
																											]
																										: correctAnswers.filter(
																												(answer) =>
																													answer !==
																													option.value,
																											),
																									points,
																								)
																							}
																						/>
																						<Label
																							htmlFor={`${field.id}-${option.value}`}
																							className="font-normal"
																						>
																							{option.label}
																						</Label>
																					</div>
																				))
																			) : (
																				<Select
																					value={correctAnswers[0] ?? ""}
																					onValueChange={(value) =>
																						updateQuizQuestion(
																							field,
																							[value],
																							points,
																						)
																					}
																				>
																					<SelectTrigger>
																						<SelectValue placeholder="Choose the correct answer" />
																					</SelectTrigger>
																					<SelectContent>
																						{options.map((option) => (
																							<SelectItem
																								key={option.value}
																								value={option.value}
																							>
																								{option.label}
																							</SelectItem>
																						))}
																					</SelectContent>
																				</Select>
																			)}
																		</div>
																	) : null}
																	{!isRecipientEmail ? (
																		<div className="flex max-w-36 flex-col gap-2">
																			<Label htmlFor={`${field.id}-points`}>
																				Points
																			</Label>
																			<Input
																				id={`${field.id}-points`}
																				type="number"
																				min="1"
																				value={points}
																				onChange={(event) =>
																					updateQuizQuestion(
																						field,
																						correctAnswers,
																						Math.max(
																							1,
																							Number(event.target.value) || 1,
																						),
																					)
																				}
																			/>
																		</div>
																	) : null}
																</div>
															</div>
														);
													})}
												</div>
											) : (
												<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
													Add a question to configure its score.
												</p>
											)}
										</>
									) : null}
								</div>
							)}

							{/* --- Appearance --- */}
							{activeTab === "Appearance" && (
								<div className="space-y-6">
									<div className="flex flex-col gap-1">
										<h1 className="text-2xl font-bold">Appearance</h1>
										<p className="text-muted-foreground text-sm">
											Customize the look and feel of your form.
										</p>
									</div>

									<div className="grid gap-6">
										<div className="grid gap-2">
											<Label htmlFor="submitButtonText">
												Submit Button Text
											</Label>
											<Input
												id="submitButtonText"
												type="text"
												placeholder="Submit"
												maxLength={50}
												value={formSettings.submitButtonText || ""}
												onChange={(e) =>
													setFormSettings({
														...formSettings,
														submitButtonText: e.target.value || undefined,
													})
												}
											/>
											<p className="text-xs text-muted-foreground">
												Custom text for the submit button. Defaults to
												&quot;Submit&quot;.
											</p>
										</div>
									</div>
								</div>
							)}

							{/* --- Navigation --- */}
							{activeTab === "Navigation" && (
								<div className="space-y-6">
									<div className="flex flex-col gap-1">
										<h1 className="text-2xl font-bold">Navigation</h1>
										<p className="text-muted-foreground text-sm">
											Manage where users go after submitting the form.
										</p>
									</div>

									<div className="grid gap-6">
										<div className="grid gap-2">
											<Label htmlFor="redirectUrl">Redirect URL</Label>
											<div className="relative">
												<Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
												<Input
													id="redirectUrl"
													type="url"
													placeholder="https://example.com/thank-you"
													className="pl-9"
													value={formSettings.redirectUrl || ""}
													onChange={(e) =>
														setFormSettings({
															...formSettings,
															redirectUrl: e.target.value,
														})
													}
												/>
											</div>
											<p className="text-xs text-muted-foreground">
												Users will be redirected to this URL after successful
												submission.
											</p>
										</div>
									</div>
								</div>
							)}

							{activeTab === "Integrations" && (
								<div className="space-y-10">
									<GoogleSheetsIntegration
										formId={formId}
										onPickerOpenChange={setGooglePickerOpen}
									/>
								</div>
							)}
						</div>
					</main>
				</SidebarProvider>
			</DialogContent>
		</Dialog>
	);
}
