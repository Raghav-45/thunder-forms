import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ContinueWithOAuthButtonsGroup } from "./oauth-buttons";

export function SignupForm({
	className,
	onSuccess,
	...props
}: React.ComponentPropsWithoutRef<"div"> & {
	onSuccess?: () => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const AuthCredentialsValidator = z.object({
		displayName: z
			.string()
			.min(2, "Display name must be at least 2 characters long"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(1, "Password must be at least 1 characters long"),
	});

	type TAuthCredentials = z.infer<typeof AuthCredentialsValidator>;

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TAuthCredentials>({
		resolver: zodResolver(AuthCredentialsValidator),
	});

	const onSubmit = async ({
		displayName,
		email,
		password,
	}: TAuthCredentials) => {
		setIsLoading(true);

		try {
			const { error } = await authClient.signUp.email({
				name: displayName,
				email,
				password,
				// Server-registered additionalField (see lib/auth.ts); the client
				// type doesn't know it, but the API persists it at runtime.
				displayName,
			} as Parameters<typeof authClient.signUp.email>[0]);

			if (error) {
				const message = error.message || "";
				const status = (error as { status?: number }).status;
				if (message === "Too many requests" || status === 429) {
					toast.error("Too many sign-up attempts. Please wait and try later.");
					return;
				}
				toast.error(
					message.includes("already")
						? "User already registered"
						: message || "Signup failed. Please try again.",
				);
				return;
			}

			toast.success("Account created! Welcome to ThunderForms ⚡️");
			if (onSuccess) {
				onSuccess();
				return;
			}

			navigate({ to: "/dashboard" });
		} catch {
			toast.error("Signup failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Create an account</CardTitle>
					<CardDescription>
						Sign up with your Github or Google account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="grid gap-6">
							<ContinueWithOAuthButtonsGroup />
							<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
								<span className="relative z-10 bg-card px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>
							<div className="grid gap-6">
								<div className="grid gap-2">
									<Label htmlFor="displayName">Display name</Label>
									<Input
										{...register("displayName")}
										id="displayName"
										placeholder="John Doe"
										required
										disabled={isLoading}
										className={cn({ "border-red-500": errors.displayName })}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input
										{...register("email")}
										id="email"
										type="email"
										placeholder="m@example.com"
										required
										disabled={isLoading}
										className={cn({ "border-red-500": errors.email })}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="password">Password</Label>
									<Input
										{...register("password")}
										id="password"
										type="password"
										placeholder="Create a password"
										required
										disabled={isLoading}
										className={cn({ "border-red-500": errors.password })}
									/>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading && (
										<Loader2Icon className="h-4 w-4 animate-spin" />
									)}
									{isLoading ? "Creating account..." : "Sign up"}
								</Button>
							</div>
							<div className="text-center text-sm">
								Already have an account?{" "}
								<Link to="/auth/login" className="underline underline-offset-4">
									Login
								</Link>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="text-muted-foreground text-center text-xs text-balance">
				By clicking continue, you agree to our{" "}
				<a href="#" className="underline underline-offset-4 hover:text-primary">
					Terms of Service
				</a>{" "}
				and{" "}
				<a href="#" className="underline underline-offset-4 hover:text-primary">
					Privacy Policy
				</a>
				.
			</div>
		</div>
	);
}
