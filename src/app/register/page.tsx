import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import type { HomepageAction } from "@/components/homepage/homepage-data";
import { isEmailVerificationRequired } from "@/lib/email-verification-settings";

const primaryAction: HomepageAction = { href: "/register", label: "Get Started" };
const secondaryAction: HomepageAction = { href: "/sign-in", label: "Sign In" };

export default async function RegisterPage() {
  const session = await auth();
  const requiresEmailVerification = isEmailVerificationRequired();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Create your space"
      contentFirstOnMobile
      homeNavActions={{ primary: primaryAction, secondary: secondaryAction }}
      title="Turn scattered solutions into a dev library you can actually reuse."
      subtitle="Create an account to store the commands, prompts, notes, and snippets you want available on every project."
    >
      <RegisterForm requiresEmailVerification={requiresEmailVerification} />
    </AuthShell>
  );
}
