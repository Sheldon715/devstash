"use client";

import { useState } from "react";
import { LoaderCircle, MailCheck, Send } from "lucide-react";

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
    <div className="mt-5 w-full rounded-2xl border border-white/8 bg-[#10131a]/80 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-100">
            <MailCheck className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Need another link?</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Send a fresh verification email to{" "}
              <span className="font-semibold break-all text-zinc-100">{normalizedEmail}</span>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          className="h-11 rounded-xl border border-white/12 bg-white text-sm font-bold text-black hover:bg-zinc-200 sm:w-44"
          disabled={formState.isPending}
        >
          {formState.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Resend
        </Button>
      </div>

      {formState.error ? (
        <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </p>
      ) : null}

      {formState.successMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100">
          {formState.successMessage}
        </p>
      ) : null}
    </div>
  );
}
