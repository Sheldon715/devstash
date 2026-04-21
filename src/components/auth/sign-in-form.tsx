"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { INITIAL_SIGN_IN_STATE } from "@/actions/auth-state";
import {
  signInWithCredentialsAction,
  signInWithGitHubAction,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-current"
    >
      <path d="M12 .5C5.65.5.5 5.8.5 12.34c0 5.24 3.3 9.69 7.87 11.26.58.11.79-.26.79-.58v-2.04c-3.2.72-3.88-1.58-3.88-1.58-.52-1.38-1.28-1.74-1.28-1.74-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.23 1.77 1.23 1.03 1.82 2.7 1.29 3.36.98.11-.77.4-1.29.72-1.59-2.55-.3-5.23-1.32-5.23-5.89 0-1.3.45-2.36 1.19-3.19-.12-.31-.52-1.55.11-3.22 0 0 .97-.32 3.17 1.22a10.7 10.7 0 0 1 5.78 0c2.2-1.54 3.17-1.22 3.17-1.22.63 1.67.23 2.91.11 3.22.74.83 1.19 1.89 1.19 3.19 0 4.58-2.68 5.59-5.24 5.88.41.37.78 1.09.78 2.2v3.26c0 .32.21.7.8.58 4.56-1.57 7.86-6.02 7.86-11.26C23.5 5.8 18.35.5 12 .5Z" />
    </svg>
  );
}

interface SignInFormProps {
  callbackUrl: string;
  defaultEmail?: string;
  initialError?: string | null;
  successMessage?: string | null;
}

export function SignInForm({
  callbackUrl,
  defaultEmail = "",
  initialError = null,
  successMessage = null,
}: SignInFormProps) {
  const [toastMessage, setToastMessage] = useState(successMessage);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [state, formAction, isPending] = useActionState(signInWithCredentialsAction, {
    ...INITIAL_SIGN_IN_STATE,
    email: defaultEmail,
    error: initialError,
  });

  useEffect(() => {
    if (!successMessage) {
      setToastMessage(null);
      setIsToastVisible(false);
      return;
    }

    setToastMessage(successMessage);
    setIsToastVisible(false);

    const showFrame = window.requestAnimationFrame(() => {
      setIsToastVisible(true);
    });

    const hideTimeout = window.setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);

    const clearTimeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3360);

    return () => {
      window.cancelAnimationFrame(showFrame);
      window.clearTimeout(hideTimeout);
      window.clearTimeout(clearTimeoutId);
    };
  }, [successMessage]);

  return (
    <div className="space-y-6">
      {toastMessage ? (
        <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-center sm:inset-x-6 sm:top-24">
          <div
            aria-hidden={!isToastVisible}
            className={cn(
              "w-full max-w-md rounded-[22px] border border-emerald-300/12 bg-[#111317] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.38)] transition-all duration-300 ease-out",
              isToastVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-5 scale-[0.98] opacity-0",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/14">
                <CheckCircle2 className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.22em] text-emerald-300/65 uppercase">
                  Account
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-50">
                  Registration successful
                </p>
                <p className="mt-1 text-sm leading-5 text-zinc-300">{toastMessage}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Sign in</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Use your DevStash account or continue with GitHub.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {state.error}
        </div>
      ) : null}

      <form action={signInWithGitHubAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button
          type="submit"
          variant="outline"
          className="h-12 w-full rounded-2xl border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08]"
        >
          <GitHubMark />
          Sign in with GitHub
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
          <span className="bg-[#0b0b0f] px-3">Or continue with email</span>
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
            defaultValue={state.email}
            placeholder="you@example.com"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-200">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-white text-black hover:bg-zinc-200"
          disabled={isPending}
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <p className="text-sm text-zinc-400">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-medium text-sky-200 transition-colors hover:text-sky-100"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
