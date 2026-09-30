import { Icons } from "@/components/Icons";
import { AuthLayout } from "../auth-layout";
import { LoginForm } from "../components/login-form";

export default function LoginPage() {
	return (
		<AuthLayout logo={<Icons.Logo className="size-6" />}>
			<LoginForm />
		</AuthLayout>
	);
}
