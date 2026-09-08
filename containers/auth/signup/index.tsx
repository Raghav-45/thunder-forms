import { Icons } from "@/components/Icons";
import { SignupForm } from "@/components/signup-form";
import Layout from "../layout";

export default function SignupPage() {
  return (
    <Layout logo={<Icons.Logo className="size-6" />}>
      <SignupForm />
    </Layout>
  );
}
