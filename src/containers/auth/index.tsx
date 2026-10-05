import { Icons } from "#/components/Icons";
import { AuthLayout } from "#/containers/auth/auth-layout";
import { LoginForm } from "#/containers/auth/components/login-form";

export default function AuthPage() {
	return (
		<AuthLayout logo={<Icons.Logo className="size-6" />}>
			<LoginForm />
		</AuthLayout>
	);
}
