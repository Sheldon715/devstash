import { LayoutDashboard } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Your developer knowledge hub
        </p>
      </header>

      <section className="rounded-[28px] border border-border/70 bg-[#0b0b0d] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#13141a]">
            <LayoutDashboard className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Main
            </h2>
            <p className="text-sm text-muted-foreground">Phase 1 placeholder</p>
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          This area will hold the dashboard content such as collection cards,
          pinned items, and other knowledge views in the next phases. For phase
          1, the shell and layout are in place and the main panel remains
          intentionally lightweight.
        </p>
      </section>
    </DashboardShell>
  );
}
