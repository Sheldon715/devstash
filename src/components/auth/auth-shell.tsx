import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { ReactNode } from "react";

import { HomepageNav } from "@/components/homepage/homepage-nav";
import {
  itemAccentBackgrounds,
  itemAccentClasses,
  type HomepageAction,
  type HomepageAccent,
} from "@/components/homepage/homepage-data";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  homeNavActions?: {
    primary: HomepageAction;
    secondary?: HomepageAction;
  };
  subtitle: string;
  title: string;
}

const authPreviewItems: Array<{ accent: HomepageAccent; label: string }> = [
  { accent: "snippet", label: "Snippets" },
  { accent: "prompt", label: "Prompts" },
  { accent: "command", label: "Commands" },
  { accent: "note", label: "Notes" },
  { accent: "url", label: "Links" },
];

export function AuthShell({
  children,
  eyebrow,
  homeNavActions,
  subtitle,
  title,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060f] text-zinc-50 [background-image:radial-gradient(circle_at_16%_8%,rgba(95,126,234,0.2),transparent_31rem),radial-gradient(circle_at_82%_4%,rgba(141,107,232,0.18),transparent_29rem),radial-gradient(circle_at_52%_42%,rgba(231,213,173,0.06),transparent_32rem),linear-gradient(180deg,#05060f_0%,#090b18_44%,#05060f_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      {homeNavActions ? (
        <HomepageNav
          primaryAction={homeNavActions.primary}
          secondaryAction={homeNavActions.secondary}
        />
      ) : null}

      <div
        className={cn(
          "relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12",
          homeNavActions ? "pt-28" : "pt-12",
        )}
      >
        <section className="space-y-8">
          {!homeNavActions ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-md text-sm font-extrabold tracking-tight text-zinc-50 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
            >
              <span className="grid size-9 place-items-center rounded-lg border border-white/12 bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-violet-500/85 text-white shadow-[0_12px_30px_rgba(99,102,241,0.22)]">
                <FolderOpen className="size-4.5" aria-hidden="true" />
              </span>
              DevStash
            </Link>
          ) : null}

          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
              {eyebrow}
            </p>
            <h1 className="bg-gradient-to-r from-zinc-50 via-blue-100 to-[#e7d5ad] bg-clip-text text-4xl font-black leading-tight tracking-tight text-transparent sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="flex max-w-xl flex-wrap gap-2">
            {authPreviewItems.map((item) => (
              <span
                key={item.label}
                className={cn(
                  "rounded-full border bg-gradient-to-r px-3 py-1.5 text-xs font-bold",
                  itemAccentClasses[item.accent],
                  itemAccentBackgrounds[item.accent],
                )}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="grid max-w-xl gap-3 text-sm text-zinc-400 sm:grid-cols-3">
            <p className="border-l border-white/10 pl-3">
              <span className="block font-bold text-zinc-100">Searchable</span>
              Find saved context fast.
            </p>
            <p className="border-l border-white/10 pl-3">
              <span className="block font-bold text-zinc-100">Reusable</span>
              Keep proven fixes close.
            </p>
            <p className="border-l border-white/10 pl-3">
              <span className="block font-bold text-zinc-100">Organized</span>
              Group work by type.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#080b16]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
