"use client";

import type { KeyboardEvent } from "react";
import { ImageIcon, Pin, Star } from "lucide-react";
import Image from "next/image";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { QuickCopyButton } from "@/components/items/quick-copy-button";
import type { DashboardItemRecord } from "@/lib/db/items";
import { formatDashboardDate } from "@/lib/date";

interface ImageThumbnailCardProps {
  item: DashboardItemRecord;
}

export function ImageThumbnailCard({ item }: ImageThumbnailCardProps) {
  const { openItem } = useItemDrawer();
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
      className="group relative block w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[#0b0d12] hover:shadow-[0_20px_56px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-video overflow-hidden bg-[#05070b]">
        {item.fileName ? (
          <Image
            src={`/api/uploads/${item.id}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0d1117] text-zinc-500 transition-transform duration-300 group-hover:scale-105">
            <ImageIcon className="size-9" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h3 className="truncate text-base font-semibold tracking-tight text-zinc-50 transition-colors duration-300 group-hover:text-white">
              {item.title}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground transition-colors duration-300 group-hover:text-zinc-300">
              {item.description}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground">
            {item.isPinned ? <Pin className="size-3.5 fill-current" /> : null}
            {item.isFavorite ? (
              <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">
            {item.collectionNames.length ? item.collectionNames.join(", ") : item.typeLabel}
          </span>
          <span className="shrink-0">{updatedLabel}</span>
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
