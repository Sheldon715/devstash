import { Code2, FileText, FolderKanban, Search, Sparkles, Terminal } from "lucide-react";

import {
  featureCards,
  itemAccentBackgrounds,
  itemAccentClasses,
  type HomepageIcon,
} from "@/components/homepage/homepage-data";
import { cn } from "@/lib/utils";

const iconMap: Record<HomepageIcon, typeof Code2> = {
  code: Code2,
  file: FileText,
  folder: FolderKanban,
  search: Search,
  sparkles: Sparkles,
  terminal: Terminal,
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-y border-white/8 bg-[linear-gradient(180deg,rgba(16,20,38,0.42),rgba(5,6,15,0.78))] px-4 py-20 sm:px-6 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
            Everything worth reusing
          </p>
          <h2 className="text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
            One home for every developer artifact
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = iconMap[feature.icon];

            return (
              <article
                key={feature.title}
                className={cn(
                  "rounded-2xl border border-t-2 bg-[linear-gradient(145deg,rgba(99,102,241,0.055),transparent_38%),linear-gradient(180deg,rgba(13,16,32,0.92),rgba(8,10,22,0.9))] p-6 shadow-[0_14px_38px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/16",
                  itemAccentClasses[feature.accent],
                )}
              >
                <div
                  className={cn(
                    "mb-5 grid size-11 place-items-center rounded-xl border bg-gradient-to-br",
                    itemAccentClasses[feature.accent],
                    itemAccentBackgrounds[feature.accent],
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-50">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
