"use client";

import { FolderPlus, LayoutPanelLeft, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export function TopBar({ onOpenMobileSidebar }: TopBarProps) {
  return (
    <div className="border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl border-border/80 bg-card text-muted-foreground lg:hidden"
          onClick={onOpenMobileSidebar}
        >
          <LayoutPanelLeft className="size-4" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search items"
            placeholder="Search items..."
            className="h-11 rounded-xl border-border/80 bg-card pl-9 pr-20"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/80 bg-background px-2 py-1 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase sm:inline-flex">
            Ctrl K
          </span>
        </div>

        <Button
          variant="outline"
          className="hidden rounded-xl border-border/80 bg-card text-foreground sm:inline-flex"
        >
          <FolderPlus className="size-4" />
          New Collection
        </Button>

        <Button className="rounded-xl bg-foreground text-background hover:bg-foreground/90">
          <Plus className="size-4" />
          New Item
        </Button>
      </div>
    </div>
  );
}
