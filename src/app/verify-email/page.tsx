import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, FolderOpen, LogIn, MailCheck, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const session = await auth();
  const email = params.email?.trim();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406] text-zinc-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.16),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.13),transparent_24rem),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_22%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090b10]/92 shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 border-b border-white/8 bg-gradient-to-r from-sky-500/10 via-white/[0.025] to-amber-300/10 px-5 py-4 sm:px-7">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-md text-sm font-extrabold tracking-tight text-zinc-50 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:outline-none"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-violet-500/85 text-white shadow-[0_12px_30px_rgba(99,102,241,0.22)]">
                <FolderOpen className="size-4.5" aria-hidden="true" />
              </span>
              DevStash
            </Link>
            <span className="hidden rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-xs font-bold text-emerald-100 sm:inline-flex">
              Verification required
            </span>
          </div>

          <section className="px-5 py-8 sm:px-7 sm:py-10">
            <div className="mx-auto max-w-lg">
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-sky-200/20 bg-sky-300/8 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_48px_rgba(56,189,248,0.12)]">
                  <MailCheck className="size-8" aria-hidden="true" />
                </div>

                <p className="mt-6 text-xs font-bold tracking-[0.18em] text-sky-200/80 uppercase">
                  One more step
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Verify your email
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-300 sm:text-base">
                  Open the link we sent to activate your DevStash account before your first sign-in.
                </p>

                <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <MailCheck className="size-4 shrink-0 text-sky-200" aria-hidden="true" />
                  <span className="min-w-0 break-all">{email ?? "your inbox"}</span>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035]">
                <VerificationStep
                  icon={<MailCheck className="size-4" aria-hidden="true" />}
                  label="Open your inbox"
                  text="Look for the DevStash verification email."
                />
                <VerificationStep
                  icon={<ShieldCheck className="size-4" aria-hidden="true" />}
                  label="Confirm ownership"
                  text="The link proves this email belongs to your account."
                />
                <VerificationStep
                  icon={<Sparkles className="size-4" aria-hidden="true" />}
                  label="Start using DevStash"
                  text="After verification, return here and sign in."
                />
              </div>

              <ResendVerificationForm email={email} />

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  href={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  Back to sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] text-sm font-bold text-white transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:outline-none"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Use a different email
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function VerificationStep({
  icon,
  label,
  text,
}: {
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-white/8 px-4 py-4 last:border-b-0 sm:grid-cols-[2.5rem_9rem_1fr] sm:items-center">
      <div className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-sky-100">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="col-start-2 text-sm leading-6 text-zinc-400 sm:col-start-auto">
        {text}
      </p>
    </div>
  );
}
