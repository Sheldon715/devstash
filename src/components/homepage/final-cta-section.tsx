import Link from "next/link";

import {
  itemAccentBackgrounds,
  itemAccentClasses,
  type HomepageAccent,
  type HomepageAction,
} from "@/components/homepage/homepage-data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FinalCtaSectionProps {
  primaryAction: HomepageAction;
}

const ctaPreviewItems: Array<{ accent: HomepageAccent; label: string }> = [
  { accent: "snippet", label: "Snippets" },
  { accent: "prompt", label: "Prompts" },
  { accent: "command", label: "Commands" },
  { accent: "note", label: "Notes" },
  { accent: "file", label: "Files" },
  { accent: "url", label: "Links" },
];

export function FinalCtaSection({ primaryAction }: FinalCtaSectionProps) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
          Your next reusable fix belongs here
        </p>
        <h2 className="text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
          Ready to Organize Your Knowledge?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
          Start with the pieces you already reuse, then let DevStash keep them searchable,
          structured, and close at hand.
        </p>

        <div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
          {ctaPreviewItems.map((item) => (
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

        <Link
          href={primaryAction.href}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 bg-zinc-50 text-zinc-950 shadow-[0_14px_36px_rgba(255,255,255,0.08)] hover:bg-white",
          )}
        >
          {primaryAction.label}
        </Link>
      </div>
    </section>
  );
}
