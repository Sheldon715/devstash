import Link from "next/link";

import { ChaosFlow } from "@/components/homepage/chaos-flow";
import { type HomepageAction } from "@/components/homepage/homepage-data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HomepageHeroProps {
  primaryAction: HomepageAction;
}

export function HomepageHero({ primaryAction }: HomepageHeroProps) {
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:px-12 lg:pt-36">
      <div className="mx-auto mb-9 max-w-4xl text-center sm:mb-12">
        <p className="mb-2 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase sm:mb-3">
          Developer knowledge, finally indexed
        </p>
        <h1 className="bg-gradient-to-r from-zinc-50 via-blue-200 to-[#e7d5ad] bg-clip-text pb-2 text-4xl font-black leading-[1.06] tracking-tight text-transparent min-[390px]:text-5xl sm:text-6xl lg:text-7xl">
          <span className="block">Stop Losing Your</span>
          <span className="block">Developer Knowledge</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-4 sm:text-lg sm:leading-8">
          Bring snippets, prompts, commands, files, images, notes, and links out of scattered
          tools and into{" "}
          <span className="font-bold text-violet-100">one fast, searchable workspace.</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-7">
          <Link
            href={primaryAction.href}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-zinc-50 text-zinc-950 hover:bg-white",
            )}
          >
            {primaryAction.label}
          </Link>
          <Link
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/10 bg-white/[0.03] text-zinc-100 hover:border-white/16 hover:bg-white/[0.06]",
            )}
          >
            Explore Features
          </Link>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase sm:text-[13px]">
          Built for developers who reuse fixes, prompts, commands, and project context.
        </p>
      </div>

      <ChaosFlow />
    </section>
  );
}
