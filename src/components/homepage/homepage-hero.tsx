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
    <section className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-12">
      <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-14">
        <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
          Developer knowledge, finally indexed
        </p>
        <h1 className="bg-gradient-to-r from-zinc-50 via-blue-200 to-[#e7d5ad] bg-clip-text pb-2 text-5xl font-black tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          <span className="block">Stop Losing Your</span>
          <span className="block">Developer Knowledge</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
          Bring snippets, prompts, commands, files, images, notes, and links out of scattered
          tools and into{" "}
          <span className="font-bold text-violet-100">one fast, searchable workspace.</span>
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
      </div>

      <ChaosFlow />
    </section>
  );
}
