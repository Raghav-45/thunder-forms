import { Icons } from "#/components/Icons";
import { AuthLayout } from "#/containers/auth/auth-layout";
import { SignupForm } from "#/containers/auth/components/signup-form";

export default function SignupPage() {
	return (
		<AuthLayout logo={<Icons.Logo className="size-6" />}>
			<SignupForm />
		</AuthLayout>
	);
}
