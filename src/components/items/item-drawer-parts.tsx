"use client";

import { LoaderCircle, Star, type LucideIcon } from "lucide-react";

export function DrawerActionButton({
  active = false,
  activeClassName,
  danger = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  activeClassName?: string;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
        "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]",
        disabled ? "cursor-not-allowed opacity-50 hover:bg-white/[0.04]" : "",
        active && activeClassName ? activeClassName : "",
        danger && !disabled ? "text-rose-200 hover:border-rose-300/30 hover:bg-rose-400/10" : "",
      ].join(" ")}
    >
      <Icon
        className={[
          "size-4",
          active && Icon === Star ? "fill-current" : "",
          Icon === LoaderCircle ? "animate-spin" : "",
        ].join(" ")}
      />
      <span>{label}</span>
    </button>
  );
}

export function DrawerHeaderSkeleton() {
  return (
    <div className="mt-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-8 w-28 rounded-full bg-white/[0.08]" />
        <div className="h-8 w-24 rounded-full bg-white/[0.08]" />
        <div className="h-8 w-36 rounded-full bg-white/[0.08]" />
      </div>
      <div className="h-10 w-3/4 rounded-2xl bg-white/[0.08]" />
      <div className="h-4 w-full rounded-full bg-white/[0.08]" />
      <div className="h-4 w-5/6 rounded-full bg-white/[0.08]" />
    </div>
  );
}

export function DrawerActionBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 animate-pulse">
      <div className="h-11 w-28 rounded-2xl bg-white/[0.08]" />
      <div className="h-11 w-20 rounded-2xl bg-white/[0.08]" />
      <div className="h-11 w-24 rounded-2xl bg-white/[0.08]" />
      <div className="ml-auto h-11 w-24 rounded-2xl bg-white/[0.08]" />
    </div>
  );
}

export function DrawerBodySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
            <div className="h-3 w-20 rounded-full bg-white/[0.08]" />
            <div className="mt-4 h-5 w-3/4 rounded-full bg-white/[0.08]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 rounded-full bg-white/[0.08]" />
        <div className="h-[4.5rem] rounded-[1.5rem] bg-white/[0.05]" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-20 rounded-full bg-white/[0.08]" />
        <div className="h-48 rounded-[1.5rem] bg-white/[0.05]" />
      </div>
    </div>
  );
}
