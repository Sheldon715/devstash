"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownAZ,
  CalendarDays,
  Check,
  ChevronDown,
  FolderOpen,
  Shapes,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardFavoriteCollectionRecord } from "@/lib/db/collections";
import type { DashboardItemRecord } from "@/lib/db/items";
import { formatDashboardDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface FavoritesListProps {
  collections: DashboardFavoriteCollectionRecord[];
  items: DashboardItemRecord[];
}

type FavoriteItemSort = "az" | "newest" | "oldest" | "type" | "za";

const FAVORITE_ITEM_SORT_OPTIONS: {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: FavoriteItemSort;
}[] = [
  {
    icon: CalendarDays,
    label: "Newest",
    value: "newest",
  },
  {
    icon: CalendarDays,
    label: "Oldest",
    value: "oldest",
  },
  {
    icon: ArrowDownAZ,
    label: "A-Z",
    value: "az",
  },
  {
    icon: ArrowDownAZ,
    iconClassName: "rotate-180",
    label: "Z-A",
    value: "za",
  },
  {
    icon: Shapes,
    label: "Type",
    value: "type",
  },
];

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
  const [sortBy, setSortBy] = useState<FavoriteItemSort>("newest");
  const sortedItems = useMemo(() => sortFavoriteItems(items, sortBy), [items, sortBy]);

  return (
    <section className="border-t border-white/10">
      <FavoritesSectionHeader count={items.length} label="Items">
        {items.length ? (
          <FavoriteItemSortControl sortBy={sortBy} onChange={setSortBy} />
        ) : null}
      </FavoritesSectionHeader>

      {items.length ? (
        <div className="divide-y divide-white/8 border-b border-white/10">
          {sortedItems.map((item) => (
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

function FavoritesSectionHeader({
  children,
  count,
  label,
}: {
  children?: ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
          {label}
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function FavoriteItemSortControl({
  onChange,
  sortBy,
}: {
  onChange: (value: FavoriteItemSort) => void;
  sortBy: FavoriteItemSort;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeOption = FAVORITE_ITEM_SORT_OPTIONS.find((option) => option.value === sortBy);
  const ActiveIcon = activeOption?.icon ?? CalendarDays;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSelect(value: FavoriteItemSort) {
    onChange(value);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-auto"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-zinc-50 sm:w-40"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <ActiveIcon
            className={cn("size-3.5 shrink-0", activeOption?.iconClassName)}
          />
          <span className="truncate">{activeOption?.label ?? "Newest"}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
            isOpen ? "rotate-180 text-zinc-300" : "",
          )}
        />
      </button>

      <div
        className={cn(
          "absolute right-0 top-11 z-20 w-full min-w-44 origin-top overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12] p-1.5 opacity-0 shadow-[0_18px_48px_rgba(0,0,0,0.35)] ring-1 ring-black/20 transition-all duration-200 ease-out sm:w-48",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95",
        )}
        aria-hidden={!isOpen}
        role="listbox"
        aria-label="Sort favorite items"
      >
        {FAVORITE_ITEM_SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === sortBy;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isActive}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-medium transition-colors",
                isActive
                  ? "bg-sky-300/10 text-zinc-50"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon className={cn("size-3.5 shrink-0", option.iconClassName)} />
                <span className="truncate">{option.label}</span>
              </span>
              {isActive ? <Check className="size-3.5 shrink-0 text-sky-200" /> : null}
            </button>
          );
        })}
      </div>
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

function sortFavoriteItems(items: DashboardItemRecord[], sortBy: FavoriteItemSort) {
  return items
    .map((item, index) => ({ index, item }))
    .sort((left, right) => {
      const order = compareFavoriteItems(left.item, right.item, sortBy);

      return order === 0 ? left.index - right.index : order;
    })
    .map(({ item }) => item);
}

function compareFavoriteItems(
  left: DashboardItemRecord,
  right: DashboardItemRecord,
  sortBy: FavoriteItemSort,
) {
  if (sortBy === "az") {
    return compareText(left.title, right.title);
  }

  if (sortBy === "za") {
    return compareText(right.title, left.title);
  }

  if (sortBy === "type") {
    return compareText(left.typeLabel, right.typeLabel) || compareText(left.title, right.title);
  }

  if (sortBy === "oldest") {
    return left.updatedAt.getTime() - right.updatedAt.getTime();
  }

  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
