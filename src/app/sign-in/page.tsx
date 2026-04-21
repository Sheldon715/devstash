import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    email?: string;
    error?: string;
    registered?: string;
  }>;
}

function getAuthErrorMessage(error?: string) {
  switch (error) {
    case "AccessDenied":
      return "Access denied for this account.";
    case "OAuthAccountNotLinked":
      return "This email is already linked to another sign-in method.";
    default:
      return null;
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = params.callbackUrl || "/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your saved developer context, right where you left it."
      subtitle="Sign in to get back to snippets, prompts, notes, commands, links, and everything else you keep in DevStash."
    >
      <SignInForm
        callbackUrl={callbackUrl}
        defaultEmail={params.email}
        initialError={getAuthErrorMessage(params.error)}
        successMessage={
          params.registered === "1"
            ? "You can sign in now."
            : null
        }
      />
    </AuthShell>
  );
}
