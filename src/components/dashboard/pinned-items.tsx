import { ItemCard } from "@/components/dashboard/item-card";
import type { DashboardItemRecord } from "@/lib/db/items";

interface PinnedItemsProps {
  items: DashboardItemRecord[];
}

export function PinnedItems({ items }: PinnedItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            Pinned Items
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} variant="featured" />
        ))}
      </div>
    </section>
  );
}
