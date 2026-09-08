import { Icons } from "@/components/Icons";
import { LoginForm } from "@/components/login-form";
import Layout from "../layout";

export default function LoginPage() {
  return (
    <Layout logo={<Icons.Logo className="size-6" />}>
      <LoginForm />
    </Layout>
  );
}
