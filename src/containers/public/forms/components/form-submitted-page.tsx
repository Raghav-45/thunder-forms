import { Link } from "@tanstack/react-router";
import { FileIcon, HomeIcon } from "lucide-react";
import { motion } from "motion/react";
import { type FC, useEffect, useState } from "react";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizResult } from "@/features/form-builder/utils/quiz";

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

interface FormSubmittedContentProps {
	redirectUrl?: string;
	quizPendingReview?: boolean;
	quizResult?: QuizResult | null;
	formPath: string;
}

export const FormSubmittedPage: FC<FormSubmittedContentProps> = ({
	redirectUrl,
	quizPendingReview = false,
	quizResult,
	formPath,
}) => {
	const [countdown, setCountdown] = useState(4);

	// Get redirectUrl from search params or use default
	const finalRedirectUrlFromProps = redirectUrl || DEFAULT_REDIRECT_URL;

	// Determine the final redirect URL with validation
	const finalRedirectUrl = finalRedirectUrlFromProps
		? finalRedirectUrlFromProps.startsWith("http://") ||
			finalRedirectUrlFromProps.startsWith("https://")
			? finalRedirectUrlFromProps
			: `https://${finalRedirectUrlFromProps}`
		: null;

	useEffect(() => {
		if (finalRedirectUrl && countdown > 0) {
			const timer = setInterval(() => {
				setCountdown((prev) => prev - 1);
			}, 1000);
			return () => clearInterval(timer);
		} else if (finalRedirectUrl && countdown === 0) {
			window.location.href = finalRedirectUrl;
		}
	}, [countdown, finalRedirectUrl]);

	return (
		<div className="flex flex-col min-h-svh bg-neutral-950">
			<div className="flex flex-col flex-1 p-6 md:p-10">
				<div className="flex items-center justify-center text-2xl font-medium text-white mb-8">
					<Icons.Logo className="h-8 w-8 mr-2" />
					Thunder Forms
				</div>

				<div className="flex-1 flex items-center justify-center">
					<Card className="w-full max-w-sm mx-auto p-6 min-h-[400px] flex flex-col justify-center bg-neutral-900 border-neutral-800 backdrop-blur-sm">
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
										className="absolute inset-0 blur-xl bg-[#ff822d]/5 rounded-full"
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
									/>
									<Checkmark
										size={80}
										strokeWidth={4}
										color="#ff822d"
										className="relative z-10"
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
								<motion.h2
									className="text-lg text-neutral-100 tracking-tighter font-semibold uppercase"
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 1, duration: 0.4 }}
								>
									Form Submitted
								</motion.h2>
								<motion.div
									className="flex-1 bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50 backdrop-blur-md"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: 1.2,
										duration: 0.4,
										ease: [0.4, 0, 0.2, 1],
									}}
								>
									<div className="flex flex-col items-center gap-3">
										<p className="text-sm text-neutral-100">
											{quizPendingReview
												? "Your quiz has been submitted. Your teacher will release your grade after review."
												: quizResult
													? quizResult.pendingPoints > 0
														? "Your quiz has been submitted. Part of your score needs review."
														: "Your quiz has been submitted."
													: "Thank you for your submission! We've received your request."}
										</p>
										{quizResult && quizResult.pendingPoints === 0 ? (
											<div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center">
												<p className="text-xs text-neutral-300">Your score</p>
												<p className="mt-1 text-2xl font-semibold text-primary">
													{quizResult.score} / {quizResult.maxScore}
												</p>
											</div>
										) : null}
										<div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
										<p className="text-xs text-neutral-400">
											Your response has been recorded.
										</p>
										{finalRedirectUrl && (
											<p className="text-xs text-neutral-400">
												Redirecting you in {countdown} seconds. <br /> Or{" "}
												<a
													href={finalRedirectUrl}
													className="text-[#ff822d] hover:underline"
												>
													click here
												</a>{" "}
												to go now.
											</p>
										)}
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 1.6, duration: 0.4 }}
									className="pt-2 flex flex-col gap-3"
								>
									<Button
										asChild
										variant="outline"
										className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border-neutral-700 hover:border-neutral-600 transition-all"
									>
										<a href={formPath}>
											<motion.span
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 1.8, duration: 0.4 }}
												className="flex items-center gap-2"
											>
												<FileIcon className="w-4 h-4" />
												Submit Another Response
											</motion.span>
										</a>
									</Button>

									<Button
										asChild
										variant="outline"
										className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border-neutral-700 hover:border-neutral-600 transition-all"
									>
										<Link to="/">
											<motion.span
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 1.9, duration: 0.4 }}
												className="flex items-center gap-2"
											>
												<HomeIcon className="w-4 h-4" />
												Return to Homepage
											</motion.span>
										</Link>
									</Button>
								</motion.div>
							</motion.div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};
