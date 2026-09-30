import { Icons } from "@/components/Icons";
import { AuthLayout } from "../auth-layout";
import { SignupForm } from "../components/signup-form";

export default function SignupPage() {
	return (
		<AuthLayout logo={<Icons.Logo className="size-6" />}>
			<SignupForm />
		</AuthLayout>
	);
}
