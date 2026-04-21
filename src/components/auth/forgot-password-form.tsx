"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ForgotPasswordResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    email: string;
  };
}

interface ForgotPasswordFormProps {
  defaultEmail?: string;
}

interface ForgotPasswordFormState {
  email: string;
  error: string | null;
  isPending: boolean;
  isSubmitted: boolean;
}

const INITIAL_FORM_STATE: ForgotPasswordFormState = {
  email: "",
  error: null,
  isPending: false,
  isSubmitted: false,
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordForm({ defaultEmail = "" }: ForgotPasswordFormProps) {
  const [formState, setFormState] = useState<ForgotPasswordFormState>({
    ...INITIAL_FORM_STATE,
    email: defaultEmail,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = formState.email.trim().toLowerCase();

    if (!email) {
      setFormState((current) => ({
        ...current,
        error: "Enter the email address tied to your account.",
      }));
      return;
    }

    if (!isValidEmail(email)) {
      setFormState((current) => ({
        ...current,
        error: "Enter a valid email address.",
      }));
      return;
    }

    setFormState((current) => ({
      ...current,
      email,
      error: null,
      isPending: true,
    }));

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const responseBody = (await response.json()) as ForgotPasswordResponseBody;

      if (!response.ok || !responseBody.success) {
        setFormState((current) => ({
          ...current,
          error:
            responseBody.error ?? "We couldn't start your password reset right now. Please try again.",
          isPending: false,
        }));
        return;
      }

      setFormState((current) => ({
        ...current,
        email,
        error: null,
        isPending: false,
        isSubmitted: true,
      }));
    } catch {
      setFormState((current) => ({
        ...current,
        error: "We couldn't start your password reset right now. Please try again.",
        isPending: false,
      }));
    }
  }

  if (formState.isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Check your email</h2>
          <p className="text-sm leading-6 text-zinc-400">
            If a DevStash account exists for <span className="font-medium text-zinc-200">{formState.email}</span>,
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-300/15 bg-emerald-400/8 p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-emerald-300/12 text-emerald-200">
              <MailCheck className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Reset link sent</p>
              <p className="text-sm leading-6 text-zinc-300">
                The link will let you choose a new password. If the email does not arrive, check your spam folder
                or try again in a moment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/sign-in?email=${encodeURIComponent(formState.email)}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() =>
              setFormState((current) => ({
                ...current,
                error: null,
                isSubmitted: false,
              }))
            }
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
          >
            Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Forgot your password?</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Enter the email for your credentials account and we&apos;ll send you a secure reset link.
        </p>
      </div>

      {formState.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
                error: null,
              }))
            }
            placeholder="you@example.com"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-white text-black hover:bg-zinc-200"
          disabled={formState.isPending}
        >
          {formState.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-zinc-400">
        Remembered it?{" "}
        <Link
          href={formState.email ? `/sign-in?email=${encodeURIComponent(formState.email)}` : "/sign-in"}
          className="font-medium text-sky-200 transition-colors hover:text-sky-100"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
