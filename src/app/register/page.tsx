import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Create your space"
      title="Turn scattered solutions into a dev library you can actually reuse."
      subtitle="Create an account to store the commands, prompts, notes, and snippets you want available on every project."
    >
      <RegisterForm />
    </AuthShell>
  );
}
