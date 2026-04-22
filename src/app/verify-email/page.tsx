import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck, ShieldCheck, Sparkles } from "lucide-react";

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

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406] text-zinc-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(245,158,11,0.12),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.14)_0.8px,transparent_0.8px)] [background-size:22px_22px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d12]/88 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="border-b border-white/8 bg-gradient-to-r from-sky-500/10 via-transparent to-amber-300/8 px-6 py-5 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-zinc-200 uppercase"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-amber-300 text-base font-bold text-slate-950">
                D
              </span>
              DevStash
            </Link>
          </div>

          <section className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="relative flex size-20 items-center justify-center rounded-[28px] border border-sky-300/20 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="absolute inset-2 rounded-[22px] bg-gradient-to-br from-sky-400/16 via-transparent to-amber-300/12 blur-sm" />
                <MailCheck className="relative size-9 text-sky-200" />
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-medium tracking-[0.28em] text-sky-200/80 uppercase">
                  One more step
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Check your email
                </h1>
                <p className="text-sm leading-7 text-zinc-300 sm:text-base">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-white">
                    {params.email ?? "your inbox"}
                  </span>
                  . Open it to activate your DevStash account before your first sign-in.
                </p>
              </div>

              <div className="mt-8 grid w-full gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-left">
                <div className="flex items-start gap-3 rounded-[1.15rem] border border-white/6 bg-black/20 px-4 py-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-zinc-300">
                    The link confirms you own the email address tied to this account.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[1.15rem] border border-white/6 bg-black/20 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <p className="text-sm leading-6 text-zinc-300">
                    After verification, you can return and sign in with your email and password.
                  </p>
                </div>
              </div>

              <ResendVerificationForm email={params.email} />

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  href={`/sign-in${params.email ? `?email=${encodeURIComponent(params.email)}` : ""}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Back to sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
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
