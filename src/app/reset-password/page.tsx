import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getPasswordResetTokenStatus } from "@/lib/password-reset";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
}

function getInvalidResetCopy(status: "expired" | "invalid") {
  if (status === "expired") {
    return {
      description: "That password reset link has expired. Request a fresh one to continue.",
      title: "Reset link expired",
    };
  }

  return {
    description: "That password reset link is invalid or has already been used.",
    title: "Reset link unavailable",
  };
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const token = typeof params.token === "string" ? params.token.trim() : "";
  const status =
    email && token ? await getPasswordResetTokenStatus(email, token) : ("invalid" as const);

  if (status !== "valid") {
    const copy = getInvalidResetCopy(status);

    return (
      <AuthShell
        eyebrow="Secure account recovery"
        title={copy.title}
        subtitle={copy.description}
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-4 text-sm leading-6 text-rose-100">
            {copy.description}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Request a new link
            </Link>
            <Link
              href={email ? `/sign-in?email=${encodeURIComponent(email)}` : "/sign-in"}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title="Create a fresh password for DevStash."
      subtitle="Choose a new password for your credentials account. This reset link can only be used once."
    >
      <ResetPasswordForm email={email} token={token} />
    </AuthShell>
  );
}
