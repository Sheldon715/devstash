"use client";

import { LoaderCircle, Pin, Star, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface IconActionButtonProps {
  active?: boolean;
  activeClassName?: string;
  buttonClassName?: string;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  iconOnly?: boolean;
  label: string;
  onClick?: () => void;
  size?: "compact" | "default";
}

export function IconActionButton({
  active = false,
  activeClassName,
  buttonClassName,
  danger = false,
  disabled = false,
  icon: Icon,
  iconOnly = false,
  label,
  onClick,
  size = "default",
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 border text-sm font-medium transition-colors",
        size === "compact"
          ? iconOnly
            ? "h-10 w-10 rounded-xl px-0"
            : "h-10 rounded-xl px-3"
          : iconOnly
            ? "h-11 w-11 rounded-2xl px-0"
            : "h-11 rounded-2xl px-4",
        "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]",
        active && activeClassName,
        danger && !disabled && "text-rose-200 hover:border-rose-300/30 hover:bg-rose-400/10",
        disabled && "cursor-not-allowed opacity-60 hover:bg-white/[0.04]",
        buttonClassName,
      )}
    >
      <Icon
        className={cn(
          "size-4",
          active && (Icon === Star || Icon === Pin) && "fill-current",
          Icon === LoaderCircle && "animate-spin",
        )}
      />
      <span className={iconOnly ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
