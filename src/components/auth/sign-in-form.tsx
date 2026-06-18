"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { INITIAL_SIGN_IN_STATE } from "@/actions/auth-state";
import { signInWithCredentialsAction } from "@/actions/auth";
import { GitHubAuthButton } from "@/components/auth/github-auth-button";
import { RedirectLoadingOverlay } from "@/components/layout/redirect-loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessToast } from "@/components/ui/success-toast";

interface SignInFormProps {
  callbackUrl: string;
  defaultEmail?: string;
  initialError?: string | null;
  successAsToast?: boolean;
  successMessage?: string | null;
  successTitle?: string | null;
}

export function SignInForm({
  callbackUrl,
  defaultEmail = "",
  initialError = null,
  successAsToast = false,
  successMessage = null,
  successTitle = null,
}: SignInFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signInWithCredentialsAction, {
    ...INITIAL_SIGN_IN_STATE,
    email: defaultEmail,
    error: initialError,
  });
  const [emailValue, setEmailValue] = useState(state.email);
  const [isToastVisible, setIsToastVisible] = useState(
    successAsToast && Boolean(successMessage),
  );
  const redirectMessage = state.redirectTo ? "Opening your workspace." : null;
  const forgotPasswordEmail = emailValue.trim();

  useEffect(() => {
    if (!state.redirectTo) {
      return;
    }

    router.replace(state.redirectTo);
  }, [router, state.redirectTo]);

  return (
    <div className="space-y-6">
      {successAsToast && successMessage ? (
        isToastVisible ? (
          <SuccessToast
            message={successMessage}
            onDone={() => setIsToastVisible(false)}
            title={successTitle ?? "Success"}
          />
        ) : null
      ) : successMessage ? (
        <div className="rounded-2xl border border-emerald-300/12 bg-emerald-300/8 px-4 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/14">
              <CheckCircle2 className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium tracking-[0.22em] text-emerald-300/65 uppercase">
                Account
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-50">
                {successTitle ?? "Success"}
              </p>
              <p className="mt-1 text-sm leading-5 text-zinc-300">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white">Sign in</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Use your DevStash account or continue with GitHub.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <p>{state.error}</p>
          {state.resendVerificationEmail ? (
            <Link
              href={`/verify-email?email=${encodeURIComponent(state.resendVerificationEmail)}`}
              className="mt-2 inline-flex text-xs font-bold tracking-[0.14em] text-violet-200 uppercase transition-colors hover:text-violet-100"
            >
              Resend verification email
            </Link>
          ) : null}
        </div>
      ) : null}

      <GitHubAuthButton callbackUrl={callbackUrl} label="Sign in with GitHub" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
          <span className="bg-[#080b16] px-3">Or continue with email</span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-200">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium text-zinc-200">
              Password
            </label>
            <Link
              href={
                forgotPasswordEmail
                  ? `/forgot-password?email=${encodeURIComponent(forgotPasswordEmail)}`
                  : "/forgot-password"
              }
              className="text-xs font-bold tracking-[0.14em] text-violet-200/85 uppercase transition-colors hover:text-violet-100"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-lg bg-zinc-50 text-zinc-950 hover:bg-white"
          disabled={isPending || Boolean(redirectMessage)}
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {redirectMessage ? "Redirecting..." : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-zinc-400">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-bold text-violet-200 transition-colors hover:text-violet-100"
        >
          Create one
        </Link>
      </p>

      {redirectMessage ? (
        <RedirectLoadingOverlay title="Signed in" message={redirectMessage} />
      ) : null}
    </div>
  );
}
