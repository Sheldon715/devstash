import { Check, Sparkles } from "lucide-react";

import { aiHighlights } from "@/components/homepage/homepage-data";
import { Badge } from "@/components/ui/badge";

export function AiSection() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <Badge
            variant="outline"
            className="mb-5 border-[#e7d5ad]/30 bg-[#e7d5ad]/10 text-[#eadbbd]"
          >
            Pro Feature
          </Badge>
          <h2 className="text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
            Let AI clean up the pile
          </h2>
          <ul className="mt-7 grid gap-4">
            {aiHighlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-zinc-300">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet-200/12 text-violet-200">
                  <Check className="size-4" aria-hidden="true" />
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#05060f] shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
          <div className="flex min-h-12 items-center gap-2 border-b border-white/10 bg-[#090c1a] px-4">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-400" />
            <p className="ml-3 font-mono text-xs font-bold text-zinc-400">snippet.ts</p>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-violet-100 sm:p-6">
            <code>{`export function compactTags(tags) {
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}`}</code>
          </pre>
          <div className="flex flex-col gap-3 border-t border-white/10 bg-gradient-to-r from-blue-400/10 to-violet-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 font-bold text-violet-200">
              <Sparkles className="size-4" aria-hidden="true" />
              AI Generated Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {["typescript", "utility", "cleanup"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-violet-200/25 bg-violet-200/10 px-2.5 py-1 text-xs font-bold text-violet-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
