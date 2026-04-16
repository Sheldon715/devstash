import { CollectionsSection } from "@/components/dashboard/collections-section";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="mx-auto w-full space-y-8 xl:space-y-9">
        <header className="space-y-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Dashboard
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Your developer knowledge hub
          </p>
        </header>

        <StatsCards />
        <CollectionsSection />
        <PinnedItems />
        <RecentItems />
      </div>
    </DashboardShell>
  );
}
