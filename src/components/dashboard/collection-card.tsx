import { MoreHorizontal, Star } from "lucide-react";

import {
  getDashboardItemTypeColor,
  getDashboardItemTypeIcon,
} from "@/lib/dashboard-icons";
import {
  getCollectionItems,
  getUniqueItemTypes,
  type DashboardCollectionRecord,
} from "@/lib/dashboard-data";

interface CollectionCardProps {
  collection: DashboardCollectionRecord;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const items = getCollectionItems(collection.itemIds);
  const itemTypes = getUniqueItemTypes(items);
  const accentColor = itemTypes[0]
    ? getDashboardItemTypeColor(itemTypes[0])
    : "text-muted-foreground";

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-5 shadow-[0_18px_56px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current ${accentColor}`}
      />

      <div className="relative flex h-full flex-col gap-5 pl-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-50">
                {collection.name}
              </h3>
              {collection.isFavorite ? (
                <Star className="size-4.5 fill-[#facc15] text-[#facc15]" />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-white/8 hover:bg-white/[0.03] hover:text-zinc-50"
          >
            <MoreHorizontal className="size-4.5" />
            <span className="sr-only">Open collection actions</span>
          </button>
        </div>

        <p className="max-w-lg text-sm leading-7 text-muted-foreground">
          {collection.description}
        </p>

        <div className="mt-auto flex items-center gap-2 text-muted-foreground">
          {itemTypes.map((typeKey) => {
            const Icon = getDashboardItemTypeIcon(typeKey);

            return (
              <div
                key={typeKey}
                className={`flex size-8 items-center justify-center rounded-lg bg-white/[0.03] ${getDashboardItemTypeColor(typeKey)}`}
              >
                <Icon className="size-3.5" />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
