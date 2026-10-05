import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon, FileIcon, HomeIcon } from "lucide-react";
import { motion } from "motion/react";
import { type FC, Fragment, type ReactNode, useEffect, useState } from "react";
import { Icons } from "#/components/Icons";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import type { QuizResult } from "#/features/form-builder/utils/quiz";
import {
	normalizeSuccessBlockOrder,
	type SuccessBlockId,
	type SuccessExtraButton,
} from "#/lib/validators/form";

interface CheckmarkProps {
	size?: number;
	strokeWidth?: number;
	color?: string;
	className?: string;
}

// Define variants for the Checkmark SVG elements
const checkmarkVariants = {
	hidden: { pathLength: 0, opacity: 0 },
	visible: (i: number) => ({
		pathLength: 1,
		opacity: 1,
		transition: {
			pathLength: {
				delay: i * 0.2,
				type: "spring" as const,
				duration: 1.5,
				bounce: 0.2,
			},
			opacity: { delay: i * 0.2, duration: 0.2 },
		},
	}),
};

function Checkmark({
	size = 100,
	strokeWidth = 2,
	color = "currentColor",
	className = "",
}: CheckmarkProps) {
	return (
		<motion.svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			initial="hidden"
			animate="visible"
			className={className}
			role="img"
			aria-label="Form submission successful"
		>
			<title>Animated Checkmark</title>
			<motion.circle
				cx="50"
				cy="50"
				r="40"
				stroke={color}
				variants={checkmarkVariants}
				custom={0}
				style={{
					strokeWidth,
					strokeLinecap: "round",
					fill: "transparent",
				}}
			/>
			<motion.path
				d="M30 50L45 65L70 35"
				stroke={color}
				variants={checkmarkVariants}
				custom={1}
				style={{
					strokeWidth,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					fill: "transparent",
				}}
			/>
		</motion.svg>
	);
}

function readEnv(name: string): string | undefined {
	const viteValue = (import.meta.env as Record<string, string | undefined>)[
		`VITE_${name}`
	];
	if (viteValue) return viteValue;
	const nextValue =
		typeof process !== "undefined"
			? (process.env?.[`NEXT_PUBLIC_${name}`] as string | undefined)
			: undefined;
	return nextValue || undefined;
}

const DEFAULT_REDIRECT_URL =
	(readEnv("ALWAYS_REDIRECT_TO_DEFAULT_URL") === "true" &&
		readEnv("DEFAULT_REDIRECT_URL")) ||
	null;

export const REDIRECT_COUNTDOWN_SECONDS = 4;

export interface ResolvedSuccessContent {
	title: string;
	message: string;
	submitAnotherLabel: string;
	homepageLabel: string;
	visibleExtraButtons: SuccessExtraButton[];
	hasActions: boolean;
	finalRedirectUrl: string | null;
}

export function resolveSuccessContent({
	titleText,
	messageText,
	submitAnotherResponseText,
	returnToHomepageText,
	showSubmitAnotherResponse = true,
	showReturnToHomepage = true,
	extraButtons = [],
	redirectUrl,
}: {
	titleText?: string;
	messageText?: string;
	submitAnotherResponseText?: string;
	returnToHomepageText?: string;
	showSubmitAnotherResponse?: boolean;
	showReturnToHomepage?: boolean;
	extraButtons?: SuccessExtraButton[];
	redirectUrl?: string;
}): ResolvedSuccessContent {
	const finalRedirectUrlFromProps = redirectUrl || DEFAULT_REDIRECT_URL;
	const finalRedirectUrl = finalRedirectUrlFromProps
		? finalRedirectUrlFromProps.startsWith("http://") ||
			finalRedirectUrlFromProps.startsWith("https://")
			? finalRedirectUrlFromProps
			: `https://${finalRedirectUrlFromProps}`
		: null;
	const visibleExtraButtons = extraButtons.filter(
		(button) => button.label.trim() && button.url,
	);
	return {
		title: titleText?.trim() || "Form Submitted",
		message:
			messageText?.trim() ||
			"Thank you for your submission! We've received your request.",
		submitAnotherLabel:
			submitAnotherResponseText?.trim() || "Submit Another Response",
		homepageLabel: returnToHomepageText?.trim() || "Return to Homepage",
		visibleExtraButtons,
		hasActions:
			showSubmitAnotherResponse ||
			showReturnToHomepage ||
			visibleExtraButtons.length > 0,
		finalRedirectUrl,
	};
}

interface FormSubmittedContentProps {
	redirectUrl?: string;
	quizPendingReview?: boolean;
	quizResult?: QuizResult | null;
	formPath: string;
	titleText?: string;
	messageText?: string;
	blockOrder?: SuccessBlockId[];
	submitAnotherResponseText?: string;
	returnToHomepageText?: string;
	showSubmitAnotherResponse?: boolean;
	showReturnToHomepage?: boolean;
	extraButtons?: SuccessExtraButton[];
	preview?: boolean;
	renderBlock?: (block: SuccessBlockId, content: ReactNode) => ReactNode;
}

export function SubmittedTitleBlock({ title }: { title: string }) {
	return (
		<motion.h2
			className="text-lg text-foreground tracking-tighter font-semibold uppercase"
			initial={{ opacity: 0, y: 5 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 1, duration: 0.4 }}
		>
			{title}
		</motion.h2>
	);
}

export function SubmittedMessageBlock({
	message,
	quizPendingReview,
	quizResult,
	finalRedirectUrl,
	countdown,
}: {
	message: string;
	quizPendingReview: boolean;
	quizResult: QuizResult | null;
	finalRedirectUrl: string | null;
	countdown: number;
}) {
	return (
		<motion.div
			className="flex-1 bg-muted/50 rounded-xl p-4 border border-border backdrop-blur-md"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				delay: 1.2,
				duration: 0.4,
				ease: [0.4, 0, 0.2, 1],
			}}
		>
			<div className="flex flex-col items-center gap-3">
				<p className="text-sm text-foreground">
					{quizPendingReview
						? "Your quiz has been submitted. Your teacher will release your grade after review."
						: quizResult
							? quizResult.pendingPoints > 0
								? "Your quiz has been submitted. Part of your score needs review."
								: "Your quiz has been submitted."
							: message}
				</p>
				{quizResult && quizResult.pendingPoints === 0 ? (
					<div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center">
						<p className="text-xs text-muted-foreground">Your score</p>
						<p className="mt-1 text-2xl font-semibold text-primary">
							{quizResult.score} / {quizResult.maxScore}
						</p>
					</div>
				) : null}
				<div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
				<p className="text-xs text-muted-foreground">
					Your response has been recorded.
				</p>
				{finalRedirectUrl && (
					<p className="text-xs text-muted-foreground">
						Redirecting you in {countdown} seconds. <br /> Or{" "}
						<a href={finalRedirectUrl} className="text-primary hover:underline">
							click here
						</a>{" "}
						to go now.
					</p>
				)}
			</div>
		</motion.div>
	);
}

export function SubmittedButtonsBlock({
	formPath,
	submitAnotherLabel,
	homepageLabel,
	showSubmitAnotherResponse,
	showReturnToHomepage,
	visibleExtraButtons,
}: {
	formPath: string;
	submitAnotherLabel: string;
	homepageLabel: string;
	showSubmitAnotherResponse: boolean;
	showReturnToHomepage: boolean;
	visibleExtraButtons: SuccessExtraButton[];
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 1.6, duration: 0.4 }}
			className="pt-2 flex flex-col gap-3"
		>
			{showSubmitAnotherResponse ? (
				<Button asChild>
					<a href={formPath}>
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1.8, duration: 0.4 }}
							className="flex items-center gap-2"
						>
							<FileIcon className="w-4 h-4" />
							{submitAnotherLabel}
						</motion.span>
					</a>
				</Button>
			) : null}

			{showReturnToHomepage ? (
				<Button asChild variant="outline">
					<Link to="/">
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1.9, duration: 0.4 }}
							className="flex items-center gap-2"
						>
							<HomeIcon className="w-4 h-4" />
							{homepageLabel}
						</motion.span>
					</Link>
				</Button>
			) : null}

			{visibleExtraButtons.map((button) => (
				<Button key={button.id} asChild variant="outline">
					<a
						href={
							button.url.startsWith("http://") ||
							button.url.startsWith("https://")
								? button.url
								: `https://${button.url}`
						}
					>
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1.9, duration: 0.4 }}
							className="flex items-center gap-2"
						>
							<ArrowUpRightIcon className="w-4 h-4" />
							{button.label}
						</motion.span>
					</a>
				</Button>
			))}
		</motion.div>
	);
}

export const FormSubmittedPage: FC<FormSubmittedContentProps> = ({
	redirectUrl,
	quizPendingReview = false,
	quizResult,
	formPath,
	titleText,
	messageText,
	blockOrder,
	submitAnotherResponseText,
	returnToHomepageText,
	showSubmitAnotherResponse = true,
	showReturnToHomepage = true,
	extraButtons = [],
	preview = false,
	renderBlock,
}) => {
	const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);

	const {
		title,
		message,
		submitAnotherLabel,
		homepageLabel,
		visibleExtraButtons,
		hasActions,
		finalRedirectUrl,
	} = resolveSuccessContent({
		titleText,
		messageText,
		submitAnotherResponseText,
		returnToHomepageText,
		showSubmitAnotherResponse,
		showReturnToHomepage,
		extraButtons,
		redirectUrl,
	});
	const orderedBlocks = normalizeSuccessBlockOrder(blockOrder);

	useEffect(() => {
		// Builder previews render the real page without leaving the canvas.
		if (preview) return;
		if (finalRedirectUrl && countdown > 0) {
			const timer = setInterval(() => {
				setCountdown((prev) => prev - 1);
			}, 1000);
			return () => clearInterval(timer);
		} else if (finalRedirectUrl && countdown === 0) {
			window.location.href = finalRedirectUrl;
		}
	}, [countdown, finalRedirectUrl, preview]);

	return (
		<div className="flex flex-col min-h-svh bg-background">
			<div className="flex flex-col flex-1 p-6 md:p-10">
				<div className="flex items-center justify-center text-2xl font-medium text-foreground mb-8">
					<Icons.Logo className="h-8 w-8 mr-2" />
					Thunder Forms
				</div>

				<div className="flex-1 flex items-center justify-center">
					<Card className="w-full max-w-sm mx-auto p-6 min-h-[400px] flex flex-col justify-center backdrop-blur-sm">
						<CardContent className="space-y-4 flex flex-col items-center justify-center px-2 md:px-4 pb-2 md:pb-4 pt-0">
							<motion.div
								className="flex justify-center"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{
									duration: 0.4,
									ease: [0.4, 0, 0.2, 1],
									scale: { type: "spring", damping: 15, stiffness: 200 },
								}}
							>
								<div className="relative">
									<motion.div
										className="absolute inset-0 blur-xl bg-primary/10 rounded-full"
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
									/>
									<Checkmark
										size={80}
										strokeWidth={4}
										className="relative z-10 text-primary"
									/>
								</div>
							</motion.div>
							<motion.div
								className="space-y-4 text-center w-full"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.2,
									duration: 0.6,
									ease: [0.4, 0, 0.2, 1],
								}}
							>
								{orderedBlocks.map((block) => {
									// The builder always renders the buttons slot so the
									// block stays selectable while every button is hidden.
									if (block === "buttons" && !hasActions && !renderBlock)
										return null;
									const content =
										block === "title" ? (
											<SubmittedTitleBlock title={title} />
										) : block === "message" ? (
											<SubmittedMessageBlock
												message={message}
												quizPendingReview={quizPendingReview}
												quizResult={quizResult ?? null}
												finalRedirectUrl={finalRedirectUrl}
												countdown={countdown}
											/>
										) : hasActions ? (
											<SubmittedButtonsBlock
												formPath={formPath}
												submitAnotherLabel={submitAnotherLabel}
												homepageLabel={homepageLabel}
												showSubmitAnotherResponse={showSubmitAnotherResponse}
												showReturnToHomepage={showReturnToHomepage}
												visibleExtraButtons={visibleExtraButtons}
											/>
										) : (
											<p className="py-2 text-center text-xs text-muted-foreground">
												Buttons are hidden
											</p>
										);
									if (!renderBlock)
										return <Fragment key={block}>{content}</Fragment>;
									return <div key={block}>{renderBlock(block, content)}</div>;
								})}
							</motion.div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};
