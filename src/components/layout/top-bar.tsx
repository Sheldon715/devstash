"use client";

import { useState } from "react";
import { FolderPlus, LayoutPanelLeft, Plus, Search } from "lucide-react";

import { CreateItemDialog } from "@/components/items/create-item-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export function TopBar({ onOpenMobileSidebar }: TopBarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[980px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:max-w-[1040px] 2xl:px-16">
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

          <div className="relative flex-1 xl:max-w-[560px] 2xl:max-w-[600px]">
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

          <Button
            type="button"
            className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </div>

      <CreateItemDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
}
