import Link from "next/link";
import { Star } from "lucide-react";

import { CollectionActions } from "@/components/collections/collection-actions";
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
    <article className="group relative flex min-h-[14.125rem] overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-5 text-left shadow-[0_18px_56px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0b0d12]">
      <Link
        href={`/collections/${collection.id}`}
        className="absolute inset-0 z-0 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Open ${collection.name} collection`}
      />

      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current ${accentColor}`}
      />

      <div className="pointer-events-none relative z-10 flex w-full flex-col gap-5 pl-1.5">
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

          <div className="pointer-events-auto">
            <CollectionActions
              collection={{
                id: collection.id,
                name: collection.name,
                descriptionValue: collection.descriptionValue,
                isFavorite: collection.isFavorite,
              }}
              variant="menu"
            />
          </div>
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
