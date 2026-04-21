"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    email: string;
  };
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  function updateField(field: keyof Omit<RegisterFormState, "error" | "isPending">, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
      error: null,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = formState.email.trim().toLowerCase();
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

      if (!response.ok || !responseBody.success || !responseBody.data?.email) {
        setFormState((current) => ({
          ...current,
          error: responseBody.error ?? "We couldn't create your account. Please try again.",
          isPending: false,
        }));
        return;
      }

      const registeredEmail = responseBody.data.email;

      startTransition(() => {
        router.push(
          `/sign-in?registered=1&email=${encodeURIComponent(registeredEmail)}`,
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
        <h2 className="text-3xl font-semibold tracking-tight text-white">Create your account</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Start building your own developer knowledge hub in a few seconds.
        </p>
      </div>

      {formState.error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {formState.error}
        </div>
      ) : null}

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
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
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
            autoComplete="new-password"
            required
            value={formState.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
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
            placeholder="••••••••"
            className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-white text-black hover:bg-zinc-200"
          disabled={formState.isPending}
        >
          {formState.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <p className="text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-sky-200 transition-colors hover:text-sky-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
