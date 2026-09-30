import { GalleryVerticalEnd } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { LoginForm } from "./components/login-form";

export default function AuthPage() {
	return (
		<AuthLayout
			logo={
				<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
					<GalleryVerticalEnd className="size-4" />
				</div>
			}
		>
			<LoginForm />
		</AuthLayout>
	);
}
