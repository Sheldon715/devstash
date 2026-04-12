import { LayoutDashboard } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
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
                  This area will hold the dashboard content such as collection
                  cards, pinned items, and other knowledge views in the next
                  phases. For phase 1, the shell and layout are in place and the
                  main panel remains intentionally lightweight.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
