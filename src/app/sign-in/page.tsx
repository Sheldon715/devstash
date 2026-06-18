import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import type { HomepageAction } from "@/components/homepage/homepage-data";
import { isEmailVerificationRequired } from "@/lib/email-verification-settings";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    deleted?: string;
    email?: string;
    error?: string;
    reset?: string;
    registered?: string;
    verificationRequired?: string;
    verificationError?: string;
    verified?: string;
  }>;
}

function parseVerificationRequiredParam(value?: string) {
  switch (value) {
    case "1":
      return true;
    case "0":
      return false;
    default:
      return null;
  }
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

const primaryAction: HomepageAction = { href: "/register", label: "Get Started" };
const secondaryAction: HomepageAction = { href: "/sign-in", label: "Sign In" };

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = params.callbackUrl || "/dashboard";
  const emailVerificationRequired =
    parseVerificationRequiredParam(params.verificationRequired) ?? isEmailVerificationRequired();
  const successMessage =
    params.deleted === "1"
      ? "Your account has been deleted."
      : params.reset === "1"
      ? params.email
        ? `Your password was reset for ${params.email}. Sign in with your new password.`
        : "Your password was reset. Sign in with your new password."
      : params.verified === "1"
      ? "Your email is verified. You can sign in now."
      : params.registered === "1"
        ? emailVerificationRequired
          ? params.email
            ? `We sent a verification link to ${params.email}. Open it before signing in.`
            : "Check your inbox for your verification link before signing in."
          : params.email
            ? `Your account is ready for ${params.email}. Sign in with your email and password.`
            : "Your account is ready. Sign in with your email and password."
        : null;
  const successTitle =
    params.deleted === "1"
      ? "Account deleted"
      : params.reset === "1"
      ? "Password updated"
      : params.verified === "1"
      ? "Email verified"
      : params.registered === "1"
        ? emailVerificationRequired
          ? "Check your email"
          : "Account created"
        : null;

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      homeNavActions={{ primary: primaryAction, secondary: secondaryAction }}
      title="Your saved developer context, right where you left it."
      subtitle="Sign in to get back to snippets, prompts, notes, commands, links, and everything else you keep in DevStash."
    >
      <SignInForm
        callbackUrl={callbackUrl}
        defaultEmail={params.email}
        initialError={getAuthErrorMessage(params.error, params.verificationError)}
        successAsToast={params.deleted === "1" || params.verified === "1"}
        successMessage={successMessage}
        successTitle={successTitle}
      />
    </AuthShell>
  );
}
