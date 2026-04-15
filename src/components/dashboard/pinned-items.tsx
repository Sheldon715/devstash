import { ItemCard } from "@/components/dashboard/item-card";
import { getPinnedItems } from "@/lib/dashboard-data";

const pinnedItems = getPinnedItems();

export function PinnedItems() {
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
        {pinnedItems.map((item) => (
          <ItemCard key={item.id} item={item} variant="featured" />
        ))}
      </div>
    </section>
  );
}
