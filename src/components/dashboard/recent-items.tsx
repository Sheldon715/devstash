import { ItemCard } from "@/components/dashboard/item-card";
import { getRecentItems } from "@/lib/dashboard-data";

const recentItems = getRecentItems();

export function RecentItems() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            Recent Items
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Latest updates from your workspace
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recentItems.map((item) => (
          <ItemCard key={item.id} item={item} variant="compact" />
        ))}
      </div>
    </section>
  );
}
