"use client";

import { ChevronsLeft, ChevronsRight, FolderOpen, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSidebarContentVisibilityClass } from "@/components/layout/sidebar-utils";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function SidebarHeader({
  isCollapsed,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 min-h-[clamp(60px,8vh,78px)] items-center border-b border-white/6 py-[clamp(10px,1.4vh,16px)]",
        isCollapsed ? "justify-center px-2.5" : "justify-between px-3.5",
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-2.5 overflow-hidden rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
          isCollapsed && "justify-center",
        )}
      >
        {!isCollapsed ? (
          <>
            <div className="flex size-[clamp(32px,4vh,40px)] shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-gradient-to-br from-[#24193f] via-[#19122d] to-[#120d20] text-white shadow-[0_10px_24px_rgba(18,13,32,0.34)]">
              <FolderOpen
                className="size-[clamp(16px,2.1vh,20px)] text-[#ddd4ff]"
                aria-hidden="true"
              />
            </div>

            <div
              className={cn(
                "min-w-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                getSidebarContentVisibilityClass(isCollapsed),
              )}
            >
              <p className="text-[clamp(13px,1.65vh,15px)] font-semibold tracking-tight text-zinc-50">
                DevStash
              </p>
            </div>
          </>
        ) : null}
      </Link>

      {isCollapsed ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden rounded-xl border-white/8 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:border-sky-300/20 hover:bg-white/[0.06] hover:text-zinc-50 lg:inline-flex"
          onClick={onToggleCollapsed}
        >
          <ChevronsRight className="size-4" />
          <span className="sr-only">Expand sidebar</span>
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden rounded-xl border-white/8 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:border-sky-300/20 hover:bg-white/[0.06] hover:text-zinc-50 lg:inline-flex"
            onClick={onToggleCollapsed}
          >
            <ChevronsLeft className="size-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl border-white/8 bg-white/[0.03] text-muted-foreground lg:hidden"
            onClick={onCloseMobile}
          >
            <X className="size-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
      )}
    </div>
  );
}
