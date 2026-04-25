"use client";

import type { KeyboardEvent } from "react";
import { Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { QuickCopyButton } from "@/components/items/quick-copy-button";
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
  const copyFallback = item.description === "No description yet." ? item.title : item.description;

  function handleOpen() {
    openItem(item.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpen();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="group relative flex h-full w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] p-5 text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[#0b0d12] hover:shadow-[0_20px_56px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-[24px] bg-current transition-all duration-300 group-hover:w-1.5 ${getDashboardItemTypeColor(item.typeKey)}`}
      />

      <div className="relative flex min-h-0 flex-1 pl-2">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#111522] ${
              isFeatured ? "size-14" : "size-12"
            } transition-all duration-300 group-hover:scale-105 group-hover:bg-[#151a29]`}
          >
            <DashboardItemTypeIcon
              typeKey={item.typeKey}
              className={`${isFeatured ? "size-6" : "size-5"} ${getDashboardItemTypeColor(item.typeKey)} transition-transform duration-300 group-hover:scale-110`}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col pr-10">
            <div className="space-y-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <h3
                  className={`line-clamp-2 min-w-0 flex-1 font-semibold tracking-tight text-zinc-50 ${
                    isFeatured ? "min-h-14 text-xl leading-7" : "min-h-10 text-lg leading-6"
                  } transition-colors duration-300 group-hover:text-white`}
                >
                  {item.title}
                </h3>
                <div className="flex shrink-0 items-center gap-1.5 pt-1 text-zinc-400">
                  {item.isPinned ? <Pin className="size-3.5 fill-current" /> : null}
                  {item.isFavorite ? (
                    <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
                  ) : null}
                </div>
              </div>

              <p
                className={`line-clamp-2 max-w-3xl text-zinc-300/85 ${
                  isFeatured ? "min-h-14 text-sm leading-7" : "min-h-12 text-sm leading-6"
                } transition-colors duration-300 group-hover:text-zinc-200`}
              >
                {item.description}
              </p>
            </div>

            <div className="mt-3 flex min-h-8 flex-wrap content-start gap-1.5">
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
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 sm:text-sm">
                <span>{updatedLabel}</span>
                <span className="min-w-0 truncate">
                  In {item.collectionNames.join(", ")}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-400 sm:text-sm">{updatedLabel}</p>
            )}
          </div>
        </div>
      </div>

      <QuickCopyButton
        itemId={item.id}
        fallbackValue={copyFallback}
        className="pointer-events-none absolute right-4 bottom-4 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.25)] group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      />
    </div>
  );
}
