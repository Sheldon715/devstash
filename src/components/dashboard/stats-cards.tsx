import { Boxes, FolderOpen, Sparkles, Star, type LucideIcon } from "lucide-react";

import { getFavoriteItemsCount } from "@/lib/dashboard-data";
import { getDashboardCollectionStats } from "@/lib/db/collections";
import { dashboardMockData } from "@/lib/mock-data";

interface StatCard {
  accentClass: string;
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number;
}

const baseStats: StatCard[] = [
  {
    label: "Items",
    value: dashboardMockData.items.length,
    detail: "Saved across every type",
    accentClass: "from-[#2563eb]/25 via-[#1d4ed8]/10 to-transparent",
    icon: Boxes,
  },
  {
    label: "Favorite Items",
    value: getFavoriteItemsCount(),
    detail: "Quick-access references",
    accentClass: "from-[#f59e0b]/25 via-[#b45309]/10 to-transparent",
    icon: Star,
  },
];

export async function StatsCards() {
  const collectionStats = await getDashboardCollectionStats();
  const stats: StatCard[] = [
    baseStats[0],
    {
      label: "Collections",
      value: collectionStats.totalCollections,
      detail: "Organized knowledge groups",
      accentClass: "from-[#10b981]/25 via-[#047857]/10 to-transparent",
      icon: FolderOpen,
    },
    baseStats[1],
    {
      label: "Favorite Collections",
      value: collectionStats.favoriteCollections,
      detail: "Pinned collection shortcuts",
      accentClass: "from-[#8b5cf6]/25 via-[#6d28d9]/10 to-transparent",
      icon: Sparkles,
    },
  ];

  return (
    <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[#09090c] p-4 shadow-[0_18px_56px_rgba(0,0,0,0.24)]"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.accentClass}`}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.75rem]">
                    {stat.value}
                  </p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                  {stat.detail}
                </p>
              </div>

              <div className="flex size-10 shrink-0 items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.04] text-zinc-100">
                <Icon className="size-4.5" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
