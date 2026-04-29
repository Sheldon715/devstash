import Link from "next/link";
import { Crown, FileArchive, Image, ShieldCheck, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProItemTypeUpgradeProps {
  typeKey: "file" | "image";
}

const upgradeCopy = {
  file: {
    Icon: FileArchive,
    title: "Files are a Pro workspace tool",
    description:
      "Upgrade to store downloadable files alongside your snippets, prompts, notes, and links.",
  },
  image: {
    Icon: Image,
    title: "Images are a Pro workspace tool",
    description:
      "Upgrade to keep visual references, screenshots, and image assets in your DevStash workspace.",
  },
} as const;

const proHighlights = [
  {
    Icon: Sparkles,
    label: "Pro-only uploads",
  },
  {
    Icon: ShieldCheck,
    label: "Unlimited collections",
  },
  {
    Icon: Crown,
    label: "Unlimited saved items",
  },
] as const;

export function ProItemTypeUpgrade({ typeKey }: ProItemTypeUpgradeProps) {
  const { Icon, description, title } = upgradeCopy[typeKey];

  return (
    <section className="overflow-hidden rounded-[28px] border border-violet-200/20 bg-[#09090d] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="p-6 sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-violet-200/20 bg-violet-300/10 text-violet-100">
            <Icon className="size-6" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-violet-200/80">
            Upgrade required
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/settings"
              className={cn(
                buttonVariants(),
                "h-11 rounded-2xl bg-zinc-50 px-5 text-zinc-950 hover:bg-white",
              )}
            >
              <Crown className="size-4" />
              Upgrade to Pro
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-2xl border-white/10 bg-white/[0.03] px-5 text-zinc-100 hover:bg-white/[0.08]",
              )}
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="border-t border-white/8 bg-white/[0.025] p-6 lg:border-l lg:border-t-0 sm:p-8">
          <p className="text-sm font-semibold text-zinc-50">Included with Pro</p>
          <div className="mt-5 grid gap-3">
            {proHighlights.map(({ Icon: HighlightIcon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-200"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-300/10 text-violet-100">
                  <HighlightIcon className="size-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
