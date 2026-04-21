import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title="Reset your password without losing your place."
      subtitle="We'll email a secure reset link to the credentials account you use with DevStash."
    >
      <ForgotPasswordForm defaultEmail={params.email} />
    </AuthShell>
  );
}
