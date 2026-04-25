import { Check, ChevronDown } from "lucide-react";

import { CreateItemSectionLabel, ProBadge } from "@/components/items/create-item-fields";
import {
  createItemTypes,
  isProItemType,
  type CreatableItemTypeKey,
} from "@/components/items/create-item-utils";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardItemTypeKey } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface CreateItemTypePickerProps {
  disabled?: boolean;
  isOpen: boolean;
  onSelect: (typeKey: CreatableItemTypeKey) => void;
  onToggle: () => void;
  selectedType: CreatableItemTypeKey;
}

export function CreateItemTypePicker({
  disabled = false,
  isOpen,
  onSelect,
  onToggle,
  selectedType,
}: CreateItemTypePickerProps) {
  const selectedTypeOption =
    createItemTypes.find((itemType) => itemType.key === selectedType) ?? createItemTypes[0];

  return (
    <section className="space-y-3">
      <CreateItemSectionLabel label="Type" />
      <div className="relative">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={onToggle}
          className="flex h-10 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left text-sm font-medium text-zinc-100 outline-none transition-colors hover:border-white/18 hover:bg-white/[0.06] focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <DashboardItemTypeIcon
            typeKey={selectedTypeOption.key as DashboardItemTypeKey}
            className={cn(
              "size-4",
              getDashboardItemTypeColor(selectedTypeOption.key as DashboardItemTypeKey),
            )}
          />
          <span className="flex-1">{selectedTypeOption.label}</span>
          {isProItemType(selectedTypeOption.key) ? <ProBadge /> : null}
          <ChevronDown
            className={cn(
              "size-4 text-zinc-500 transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </button>

        {isOpen ? (
          <div
            role="listbox"
            className="create-type-menu-enter absolute top-[calc(100%+0.5rem)] left-0 z-20 w-full rounded-2xl border border-white/10 bg-[#0b0d12] p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          >
            {createItemTypes.map((itemType) => {
              const isSelected = itemType.key === selectedType;

              return (
                <button
                  key={itemType.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "create-type-menu-item flex h-9 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-zinc-300 transition-colors",
                    "hover:bg-white/[0.06] hover:text-zinc-50",
                    isSelected ? "bg-sky-300/10 text-zinc-50" : "",
                  )}
                  onClick={() => onSelect(itemType.key)}
                >
                  <DashboardItemTypeIcon
                    typeKey={itemType.key as DashboardItemTypeKey}
                    className={cn(
                      "size-4",
                      getDashboardItemTypeColor(itemType.key as DashboardItemTypeKey),
                    )}
                  />
                  <span className="flex-1">{itemType.label}</span>
                  {isProItemType(itemType.key) ? <ProBadge /> : null}
                  {isSelected ? <Check className="size-4 text-sky-200" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
