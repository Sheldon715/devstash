import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { navLinks, type HomepageAction } from "@/components/homepage/homepage-data";
import { cn } from "@/lib/utils";

interface HomepageNavProps {
  primaryAction: HomepageAction;
  secondaryAction?: HomepageAction;
}

export function HomepageNav({ primaryAction, secondaryAction }: HomepageNavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/8 bg-[#05060f]/78 px-4 backdrop-blur-xl sm:px-6 lg:px-12">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="DevStash home"
          className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-violet-500/85 text-white shadow-[0_12px_30px_rgba(99,102,241,0.22)]">
            <FolderOpen className="size-4.5" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-extrabold tracking-tight text-zinc-50 sm:text-base">
            DevStash
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-400 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 transition-colors hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={primaryAction.href}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-zinc-50 text-zinc-950 hover:bg-white",
            )}
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/16 hover:bg-white/[0.06] hover:text-zinc-50",
              )}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
