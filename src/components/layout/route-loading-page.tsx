import { FolderOpen, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface RouteLoadingPageProps {
  label?: string;
  variant?: "app" | "auth" | "upgrade";
}

const variantStyles = {
  app: {
    main: "bg-background text-foreground",
    shell: "max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16",
    panel: "border-white/10 bg-[#08090c]",
  },
  auth: {
    main: "bg-[#05060f] text-zinc-50 [background-image:linear-gradient(180deg,#05060f_0%,#090b18_48%,#05060f_100%)]",
    shell: "max-w-5xl px-5 py-12 sm:px-8 lg:px-12",
    panel: "border-white/10 bg-[#080b16]/88",
  },
  upgrade: {
    main: "bg-[linear-gradient(180deg,rgba(16,20,38,0.42),rgba(5,6,15,0.78))] text-foreground",
    shell: "max-w-4xl px-4 py-8 sm:px-6 lg:px-10",
    panel: "border-white/10 bg-[#090b16]",
  },
} satisfies Record<
  NonNullable<RouteLoadingPageProps["variant"]>,
  {
    main: string;
    panel: string;
    shell: string;
  }
>;

export function RouteLoadingPage({
  label = "Loading DevStash",
  variant = "app",
}: RouteLoadingPageProps) {
  const styles = variantStyles[variant];

  return (
    <main className={cn("min-h-screen", styles.main)}>
      <div className={cn("mx-auto flex min-h-screen w-full items-center", styles.shell)}>
        <section
          className={cn(
            "grid w-full gap-6 rounded-[28px] border p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8",
            styles.panel,
          )}
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-sky-200">
              <FolderOpen className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                DevStash
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                {label}
              </h1>
            </div>
            <LoaderCircle
              className="ml-auto size-5 shrink-0 animate-spin text-sky-200"
              aria-hidden="true"
            />
          </div>

          <div className="grid gap-3">
            <div className="h-16 animate-pulse rounded-2xl border border-white/8 bg-white/[0.035]" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
                />
              ))}
            </div>
            <div className="h-12 w-full max-w-sm animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        </section>
      </div>
    </main>
  );
}
