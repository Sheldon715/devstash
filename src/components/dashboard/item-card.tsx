"use client";

import { Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
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
  const { openItem } = useItemDrawer();
  const isFeatured = variant === "featured";
  const updatedLabel = formatDashboardDate(item.updatedAt);

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group relative block w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-4 text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[#0b0d12] hover:shadow-[0_20px_56px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current transition-all duration-300 group-hover:w-1.5 ${getDashboardItemTypeColor(item.typeKey)}`}
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
            } transition-all duration-300 group-hover:scale-105 group-hover:bg-[#151a29]`}
          >
            <DashboardItemTypeIcon
              typeKey={item.typeKey}
              className={`${isFeatured ? "size-6" : "size-4.5"} ${getDashboardItemTypeColor(item.typeKey)} transition-transform duration-300 group-hover:scale-110`}
            />
          </div>

          <div className="min-w-0 space-y-2.5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3
                  className={`min-w-0 truncate font-semibold tracking-tight text-zinc-50 ${
                    isFeatured ? "text-xl" : "text-base"
                  } transition-colors duration-300 group-hover:text-white`}
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
                } transition-colors duration-300 group-hover:text-zinc-300`}
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
    </button>
  );
}
