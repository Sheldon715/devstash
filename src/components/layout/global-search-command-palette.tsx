"use client";

import { FolderOpen, Search } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardSearchData } from "@/lib/db/search";
import { filterGlobalSearchResult } from "@/lib/search-filter";

interface GlobalSearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchData: DashboardSearchData;
}

export function GlobalSearchCommandPalette({
  open,
  onOpenChange,
  searchData,
}: GlobalSearchCommandPaletteProps) {
  const router = useRouter();
  const { openItem } = useItemDrawer();
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      onOpenChange(!open);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onOpenChange, open]);

  function handleItemSelect(itemId: string) {
    onOpenChange(false);
    window.requestAnimationFrame(() => openItem(itemId));
  }

  function handleCollectionSelect(collectionId: string) {
    onOpenChange(false);
    window.requestAnimationFrame(() => router.push(`/collections/${collectionId}`));
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[170] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close search"
        className="global-search-overlay-enter absolute inset-0 bg-black/45"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="global-search-panel-enter relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#090a0e] text-zinc-50 shadow-[0_28px_90px_rgba(0,0,0,0.52)]"
      >
        <h2 id={titleId} className="sr-only">
          Search DevStash
        </h2>
        <p id={descriptionId} className="sr-only">
          Search items and collections across your workspace.
        </p>

        <Command filter={filterGlobalSearchResult} shouldFilter loop>
          <div className="flex items-center border-b border-white/8 px-3">
            <Search className="mr-2 size-4 shrink-0 text-zinc-500" />
            <CommandInput ref={inputRef} placeholder="Search items and collections..." />
          </div>

          <CommandList>
            <CommandEmpty>No matching items or collections.</CommandEmpty>

            <CommandGroup heading="Items">
              {searchData.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`item-${item.id}`}
                  keywords={[item.title, item.typeLabel, item.contentPreview]}
                  onSelect={() => handleItemSelect(item.id)}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <DashboardItemTypeIcon
                      typeKey={item.typeKey}
                      className={`size-4 ${getDashboardItemTypeColor(item.typeKey)}`}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-zinc-100">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {item.typeLabel}
                      {item.contentPreview ? ` - ${item.contentPreview}` : ""}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Collections">
              {searchData.collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={`collection-${collection.id}`}
                  keywords={[collection.name, String(collection.itemCount)]}
                  onSelect={() => handleCollectionSelect(collection.id)}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400">
                    <FolderOpen className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-zinc-100">
                      {collection.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>,
    document.body,
  );
}
