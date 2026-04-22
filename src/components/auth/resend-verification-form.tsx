"use client";

import { useState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ResendVerificationResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    email: string;
  };
}

interface ResendVerificationFormProps {
  email?: string;
}

interface ResendVerificationFormState {
  error: string | null;
  isPending: boolean;
  successMessage: string | null;
}

const INITIAL_FORM_STATE: ResendVerificationFormState = {
  error: null,
  isPending: false,
  successMessage: null,
};

export function ResendVerificationForm({ email }: ResendVerificationFormProps) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  if (!normalizedEmail) {
    return null;
  }

  async function handleSubmit() {
    setFormState({
      error: null,
      isPending: true,
      successMessage: null,
    });

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });
      const responseBody = (await response.json()) as ResendVerificationResponseBody;

      if (!response.ok || !responseBody.success) {
        setFormState({
          error:
            responseBody.error ??
            "We couldn't resend your verification email right now. Please try again.",
          isPending: false,
          successMessage: null,
        });
        return;
      }

      setFormState({
        error: null,
        isPending: false,
        successMessage: `If an unverified DevStash account exists for ${normalizedEmail}, we sent a fresh verification link.`,
      });
    } catch {
      setFormState({
        error: "We couldn't resend your verification email right now. Please try again.",
        isPending: false,
        successMessage: null,
      });
    }
  }

  return (
    <div className="mt-6 w-full rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-sky-300/10 text-sky-200">
          <MailCheck className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Need another verification email?</p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            We can send a fresh link to <span className="font-medium text-white">{normalizedEmail}</span>.
          </p>
        </div>
      </div>

      {formState.error ? (
        <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </p>
      ) : null}

      {formState.successMessage ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100">
          {formState.successMessage}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={handleSubmit}
        className="mt-4 h-11 w-full rounded-2xl border border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08]"
        disabled={formState.isPending}
      >
        {formState.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Resend verification email
      </Button>
    </div>
  );
}
