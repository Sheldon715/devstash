import { MoreHorizontal, Star } from "lucide-react";

import {
  DashboardItemTypeIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import { formatDashboardDate } from "@/lib/date";

interface CollectionCardProps {
  collection: DashboardCollectionCardRecord;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const accentColor = collection.dominantTypeKey
    ? getDashboardItemTypeColor(collection.dominantTypeKey)
    : "text-muted-foreground";
  const updatedLabel = collection.lastUpdatedAt
    ? formatDashboardDate(collection.lastUpdatedAt)
    : null;
  const statsLabel =
    collection.typeCount > 0
      ? `${collection.itemCount} ${collection.itemCount === 1 ? "item" : "items"}, ${collection.typeCount} ${collection.typeCount === 1 ? "type" : "types"}`
      : "No items yet";

  return (
    <article className="group relative flex min-h-[14.125rem] overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-5 shadow-[0_18px_56px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current ${accentColor}`}
      />

      <div className="relative flex w-full flex-col gap-5 pl-1.5">
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
              {statsLabel}
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

        <p className="line-clamp-2 max-w-lg text-sm leading-7 text-muted-foreground">
          {collection.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            {collection.typeKeys.map((typeKey) => {
              return (
                <div
                  key={typeKey}
                  className={`flex size-8 items-center justify-center rounded-lg bg-white/[0.03] ${getDashboardItemTypeColor(typeKey)}`}
                >
                  <DashboardItemTypeIcon typeKey={typeKey} className="size-3.5" />
                </div>
              );
            })}
          </div>

          {updatedLabel ? (
            <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
              Updated {updatedLabel}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
