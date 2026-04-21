"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isValidPasswordResetPassword,
  PASSWORD_RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";

interface ResetPasswordResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    email: string;
  };
}

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

interface ResetPasswordFormState {
  confirmPassword: string;
  error: string | null;
  isPending: boolean;
  password: string;
}

const INITIAL_FORM_STATE: ResetPasswordFormState = {
  confirmPassword: "",
  error: null,
  isPending: false,
  password: "",
};

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.password || !formState.confirmPassword) {
      setFormState((current) => ({
        ...current,
        error: "Enter and confirm your new password.",
      }));
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setFormState((current) => ({
        ...current,
        error: "Passwords do not match.",
      }));
      return;
    }

    if (!isValidPasswordResetPassword(formState.password)) {
      setFormState((current) => ({
        ...current,
        error: `Use at least ${PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters for your password.`,
      }));
      return;
    }

    setFormState((current) => ({
      ...current,
      error: null,
      isPending: true,
    }));

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmPassword: formState.confirmPassword,
          email,
          password: formState.password,
          token,
        }),
      });
      const responseBody = (await response.json()) as ResetPasswordResponseBody;

      if (!response.ok || !responseBody.success || !responseBody.data?.email) {
        setFormState((current) => ({
          ...current,
          error: responseBody.error ?? "We couldn't reset your password right now. Please try again.",
          isPending: false,
        }));
        return;
      }

      const resetEmail = responseBody.data.email;

      startTransition(() => {
        router.push(`/sign-in?reset=1&email=${encodeURIComponent(resetEmail)}`);
      });
    } catch {
      setFormState((current) => ({
        ...current,
        error: "We couldn't reset your password right now. Please try again.",
        isPending: false,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Choose a new password</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Resetting password for <span className="font-medium text-zinc-200">{email}</span>.
        </p>
      </div>

      {formState.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-200">
            New password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formState.password}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                error: null,
                password: event.target.value,
              }))
            }
            placeholder="Enter your new password"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-200">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formState.confirmPassword}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                confirmPassword: event.target.value,
                error: null,
              }))
            }
            placeholder="Re-enter your new password"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-white text-black hover:bg-zinc-200"
          disabled={formState.isPending}
        >
          {formState.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Reset password
        </Button>

        <p className="text-xs leading-5 text-zinc-500">
          Use at least {PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters for your new password.
        </p>
      </form>

      <p className="text-sm text-zinc-400">
        Need a fresh link?{" "}
        <Link
          href={`/forgot-password?email=${encodeURIComponent(email)}`}
          className="font-medium text-sky-200 transition-colors hover:text-sky-100"
        >
          Request another reset
        </Link>
      </p>
    </div>
  );
}
