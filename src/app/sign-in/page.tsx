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
    verificationError?: string;
    verified?: string;
  }>;
}

function getAuthErrorMessage(error?: string, verificationError?: string) {
  switch (verificationError) {
    case "expired":
      return "That verification link has expired. Register again to get a fresh email.";
    case "invalid":
      return "That verification link is invalid or has already been used.";
    default:
      break;
  }

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
  const successMessage =
    params.verified === "1"
      ? "Your email is verified. You can sign in now."
      : params.registered === "1"
        ? params.email
          ? `We sent a verification link to ${params.email}. Open it before signing in.`
          : "Check your inbox for your verification link before signing in."
        : null;
  const successTitle = params.verified === "1" ? "Email verified" : "Check your email";

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
        initialError={getAuthErrorMessage(params.error, params.verificationError)}
        successMessage={successMessage}
        successTitle={successMessage ? successTitle : null}
      />
    </AuthShell>
  );
}
