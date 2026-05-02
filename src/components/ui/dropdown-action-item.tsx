"use client";

import { LoaderCircle, Star, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DropdownActionItemProps {
  active?: boolean;
  className?: string;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function DropdownActionItem({
  active = false,
  className,
  danger = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: DropdownActionItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors",
        "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-50",
        danger && !disabled && "text-rose-200 hover:bg-rose-400/10",
        active && "text-[#facc15]",
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-4",
          active && Icon === Star && "fill-current",
          Icon === LoaderCircle && "animate-spin",
        )}
      />
      <span>{label}</span>
    </button>
  );
}
