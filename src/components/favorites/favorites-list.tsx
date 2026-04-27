"use client";

import type { KeyboardEvent } from "react";
import { FolderOpen, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardFavoriteCollectionRecord } from "@/lib/db/collections";
import type { DashboardItemRecord } from "@/lib/db/items";
import { formatDashboardDate } from "@/lib/date";

interface FavoritesListProps {
  collections: DashboardFavoriteCollectionRecord[];
  items: DashboardItemRecord[];
}

export function FavoritesList({ collections, items }: FavoritesListProps) {
  const hasFavorites = items.length > 0 || collections.length > 0;

  if (!hasFavorites) {
    return (
      <section className="border-y border-white/10 py-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-yellow-200">
            <Star className="size-5" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Empty Favorites
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Nothing starred yet
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Star items or collections to keep them here as a quick-access working set.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-10 font-mono">
      <FavoriteItemSection items={items} />
      <FavoriteCollectionSection collections={collections} />
    </div>
  );
}

function FavoriteItemSection({ items }: { items: DashboardItemRecord[] }) {
  return (
    <section className="border-t border-white/10">
      <FavoritesSectionHeader count={items.length} label="Items" />

      {items.length ? (
        <div className="divide-y divide-white/8 border-b border-white/10">
          {items.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <FavoritesSectionEmpty label="No favorite items" />
      )}
    </section>
  );
}

function FavoriteCollectionSection({
  collections,
}: {
  collections: DashboardFavoriteCollectionRecord[];
}) {
  return (
    <section className="border-t border-white/10">
      <FavoritesSectionHeader count={collections.length} label="Collections" />

      {collections.length ? (
        <div className="divide-y divide-white/8 border-b border-white/10">
          {collections.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <FavoritesSectionEmpty label="No favorite collections" />
      )}
    </section>
  );
}

function FavoritesSectionHeader({ count, label }: { count: number; label: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
        {label}
      </h2>
      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function FavoritesSectionEmpty({ label }: { label: string }) {
  return (
    <div className="border-b border-white/10 py-5 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function FavoriteItemRow({ item }: { item: DashboardItemRecord }) {
  const { openItem } = useItemDrawer();

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
      className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 px-1 py-3.5 text-left transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset sm:grid-cols-[auto_minmax(0,1fr)_8rem_7rem] sm:items-center sm:gap-4 sm:px-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
        <DashboardItemTypeIcon
          typeKey={item.typeKey}
          className={`size-4 ${getDashboardItemTypeColor(item.typeKey)}`}
        />
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-50 group-hover:text-white">
            {item.title}
          </span>
          <Star className="size-3 shrink-0 fill-yellow-300 text-yellow-300" />
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {item.collectionNames.length
            ? `In ${item.collectionNames.join(", ")}`
            : item.description}
        </span>
      </span>

      <span className="col-start-2 w-fit rounded-md border border-white/8 bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-300 sm:col-start-auto">
        {item.typeLabel}
      </span>

      <span className="col-start-2 text-xs text-muted-foreground sm:col-start-auto sm:text-right">
        {formatDashboardDate(item.updatedAt)}
      </span>
    </div>
  );
}

function FavoriteCollectionRow({
  collection,
}: {
  collection: DashboardFavoriteCollectionRecord;
}) {
  const router = useRouter();

  function handleOpen() {
    router.push(`/collections/${collection.id}`);
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
      className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 px-1 py-3.5 text-left transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset sm:grid-cols-[auto_minmax(0,1fr)_8rem_7rem] sm:items-center sm:gap-4 sm:px-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-zinc-300">
        <FolderOpen className="size-4" />
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-50 group-hover:text-white">
            {collection.name}
          </span>
          <Star className="size-3 shrink-0 fill-yellow-300 text-yellow-300" />
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"} -{" "}
          {collection.description}
        </span>
      </span>

      <span className="col-start-2 w-fit rounded-md border border-white/8 bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-300 sm:col-start-auto">
        Collection
      </span>

      <span className="col-start-2 text-xs text-muted-foreground sm:col-start-auto sm:text-right">
        {formatDashboardDate(collection.updatedAt)}
      </span>
    </div>
  );
}
