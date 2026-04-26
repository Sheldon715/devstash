"use client";

import { useState } from "react";
import { Check, ChevronDown, Folder } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CollectionOption {
  id: string;
  name: string;
}

interface CollectionMultiSelectProps {
  disabled?: boolean;
  label?: string;
  options: CollectionOption[];
  selectedIds: string[];
  onChange: (collectionIds: string[]) => void;
}

export function CollectionMultiSelect({
  disabled = false,
  label = "Collections",
  onChange,
  options,
  selectedIds,
}: CollectionMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIdSet = new Set(selectedIds);
  const selectedCollections = options.filter((collection) => selectedIdSet.has(collection.id));
  const selectedLabel = getSelectedLabel(selectedCollections);

  function handleToggle(collectionId: string) {
    if (disabled) {
      return;
    }

    if (selectedIdSet.has(collectionId)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== collectionId));
      return;
    }

    onChange([...selectedIds, collectionId]);
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>

      <div className="relative">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-10 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left text-sm font-medium text-zinc-100 outline-none transition-colors hover:border-white/18 hover:bg-white/[0.06] focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Folder className="size-4 text-zinc-400" />
          <span className={cn("min-w-0 flex-1 truncate", selectedIds.length ? "" : "text-zinc-500")}>
            {selectedLabel}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-zinc-500 transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </button>

        {isOpen ? (
          <div
            role="listbox"
            aria-multiselectable="true"
            className="create-type-menu-enter absolute bottom-[calc(100%+0.5rem)] left-0 z-30 w-full rounded-2xl border border-white/10 bg-[#0b0d12] p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          >
            {options.length ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {options.map((collection) => {
                  const isSelected = selectedIdSet.has(collection.id);

                  return (
                    <button
                      key={collection.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={disabled}
                      onClick={() => handleToggle(collection.id)}
                      className={cn(
                        "create-type-menu-item flex h-9 min-w-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-zinc-300 transition-colors",
                        "hover:bg-white/[0.06] hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60",
                        isSelected ? "bg-sky-300/10 text-zinc-50" : "",
                      )}
                    >
                      <Folder
                        className={cn(
                          "size-4 shrink-0",
                          isSelected ? "text-sky-200" : "text-zinc-500",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                      {isSelected ? <Check className="size-4 shrink-0 text-sky-200" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl px-3 py-2.5 text-sm text-zinc-500">
                No collections yet.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getSelectedLabel(selectedCollections: CollectionOption[]) {
  if (!selectedCollections.length) {
    return "Select collections";
  }

  if (selectedCollections.length === 1) {
    return selectedCollections[0].name;
  }

  return `${selectedCollections.length} collections selected`;
}
