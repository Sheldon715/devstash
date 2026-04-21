import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}

export function AuthShell({ children, eyebrow, subtitle, title }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406] text-zinc-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(66,153,225,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-5 py-12 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:px-8">
        <section className="space-y-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-zinc-200 uppercase">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-amber-300 text-base font-bold text-slate-950">
              D
            </span>
            DevStash
          </Link>

          <div className="space-y-4">
            <p className="text-sm font-medium tracking-[0.28em] text-sky-200/90 uppercase">
              {eyebrow}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-zinc-300 sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Snippets</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Keep reusable code close at hand.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Prompts</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Save prompt workflows that already work.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Commands</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Reuse terminal recipes without digging through history.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0b0b0f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
