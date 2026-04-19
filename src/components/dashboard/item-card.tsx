import { Pin, Star } from "lucide-react";

import {
  DashboardItemTypeIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import type { DashboardItemRecord } from "@/lib/db/items";
import { formatDashboardDate } from "@/lib/date";

interface ItemCardProps {
  item: DashboardItemRecord;
  variant: "compact" | "featured";
}

export function ItemCard({ item, variant }: ItemCardProps) {
  const isFeatured = variant === "featured";
  const updatedLabel = formatDashboardDate(item.updatedAt);

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current ${getDashboardItemTypeColor(item.typeKey)}`}
      />

      <div
        className={`relative flex gap-4 pl-2 ${
          isFeatured
            ? "flex-col sm:flex-row sm:items-start sm:justify-between"
            : "items-start justify-between"
        }`}
      >
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#111522] ${
              isFeatured ? "size-14" : "size-11"
            }`}
          >
            <DashboardItemTypeIcon
              typeKey={item.typeKey}
              className={`${isFeatured ? "size-6" : "size-4.5"} ${getDashboardItemTypeColor(item.typeKey)}`}
            />
          </div>

          <div className="min-w-0 space-y-2.5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3
                  className={`min-w-0 truncate font-semibold tracking-tight text-zinc-50 ${
                    isFeatured ? "text-xl" : "text-base"
                  }`}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {item.isPinned ? <Pin className="size-3.5 fill-current" /> : null}
                  {item.isFavorite ? (
                    <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
                  ) : null}
                </div>
              </div>

              <p
                className={`max-w-3xl text-muted-foreground ${
                  isFeatured ? "text-sm leading-7" : "text-xs leading-6 sm:text-sm"
                }`}
              >
                {item.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span
                className={`rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-medium sm:text-sm ${getDashboardItemTypeColor(item.typeKey)}`}
              >
                {item.typeLabel}
              </span>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-zinc-100 sm:text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {item.collectionNames.length ? (
              <p className="text-xs text-muted-foreground sm:text-sm">
                In {item.collectionNames.join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        <p className="shrink-0 pt-1 text-xs text-muted-foreground sm:text-sm">
          {updatedLabel}
        </p>
      </div>
    </article>
  );
}
