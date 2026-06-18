"use client";

import Link from "next/link";
import { startTransition, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { GitHubAuthButton } from "@/components/auth/github-auth-button";
import { RedirectLoadingOverlay } from "@/components/layout/redirect-loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, normalizeEmailAddress } from "@/lib/email";

interface RegisterResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    email: string;
    requiresEmailVerification: boolean;
  };
}

interface RegisterFormProps {
  requiresEmailVerification: boolean;
}

interface RegisterFormState {
  confirmPassword: string;
  email: string;
  error: string | null;
  isPending: boolean;
  name: string;
  password: string;
}

const INITIAL_FORM_STATE: RegisterFormState = {
  confirmPassword: "",
  email: "",
  error: null,
  isPending: false,
  name: "",
  password: "",
};

export function RegisterForm({ requiresEmailVerification }: RegisterFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  function updateField(field: keyof Omit<RegisterFormState, "error" | "isPending">, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
      error: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = normalizeEmailAddress(formState.email);
    const trimmedName = formState.name.trim();

    if (!trimmedEmail || !formState.password || !formState.confirmPassword) {
      setFormState((current) => ({
        ...current,
        error: "Enter your email, password, and password confirmation.",
      }));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFormState((current) => ({
        ...current,
        error: "Enter a valid email address.",
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

    setFormState((current) => ({
      ...current,
      email: trimmedEmail,
      error: null,
      isPending: true,
      name: trimmedName,
    }));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: formState.password,
          confirmPassword: formState.confirmPassword,
        }),
      });

      const responseBody = (await response.json()) as RegisterResponseBody;

      if (
        !response.ok ||
        !responseBody.success ||
        !responseBody.data?.email ||
        typeof responseBody.data.requiresEmailVerification !== "boolean"
      ) {
        setFormState((current) => ({
          ...current,
          error: responseBody.error ?? "We couldn't create your account. Please try again.",
          isPending: false,
        }));
        return;
      }

      const registeredEmail = responseBody.data.email;
      const verificationRequired = responseBody.data.requiresEmailVerification;

      setRedirectMessage(
        verificationRequired
          ? "Opening the email verification page."
          : "Opening sign in for your new account.",
      );
      startTransition(() => {
        router.push(
          verificationRequired
            ? `/verify-email?email=${encodeURIComponent(registeredEmail)}`
            : `/sign-in?registered=1&email=${encodeURIComponent(registeredEmail)}&verificationRequired=0`,
        );
      });
    } catch {
      setFormState((current) => ({
        ...current,
        error: "We couldn't create your account. Please try again.",
        isPending: false,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white">Create your account</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Start building your own developer knowledge hub in a few seconds.
        </p>
      </div>

      {formState.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </div>
      ) : null}

      <GitHubAuthButton label="Continue with GitHub" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
          <span className="bg-[#080b16] px-3">Or continue with email</span>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-200">
            Name
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={formState.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="John Smith"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

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
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
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
            autoComplete="new-password"
            required
            value={formState.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="********"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-200">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formState.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            placeholder="********"
            className="h-12 rounded-lg border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-lg bg-zinc-50 text-zinc-950 hover:bg-white"
          disabled={formState.isPending}
        >
          {formState.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {redirectMessage ? "Redirecting..." : "Create account"}
        </Button>

        <p className="text-xs leading-5 text-zinc-500">
          {requiresEmailVerification
            ? "We'll send you an email verification link before your first sign-in."
            : "Email verification is currently off, so you can sign in right after creating your account."}
        </p>
      </form>

      <p className="text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-bold text-violet-200 transition-colors hover:text-violet-100"
        >
          Sign in
        </Link>
      </p>

      {redirectMessage ? (
        <RedirectLoadingOverlay title="Account created" message={redirectMessage} />
      ) : null}
    </div>
  );
}
