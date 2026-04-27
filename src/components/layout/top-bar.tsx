"use client";

import { useState } from "react";
import { FolderPlus, LayoutPanelLeft, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { CreateItemDialog } from "@/components/items/create-item-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeDashboardItemTypeRouteKey } from "@/lib/item-types";
import type { CollectionOption } from "@/components/items/collection-multi-select";

interface TopBarProps {
  collectionOptions: CollectionOption[];
  onOpenMobileSidebar: () => void;
  onOpenSearchPalette: () => void;
}

export function TopBar({
  collectionOptions,
  onOpenMobileSidebar,
  onOpenSearchPalette,
}: TopBarProps) {
  const [isCreateCollectionDialogOpen, setIsCreateCollectionDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const pathname = usePathname();
  const routeType = getCurrentItemType(pathname);
  const isFavoritesRoute = pathname === "/favorites";

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
              placeholder="Search items, collections..."
              readOnly
              className="h-11 cursor-pointer rounded-xl border-border/80 bg-card pl-9 pr-20"
              onClick={onOpenSearchPalette}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/80 bg-background px-2 py-1 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase sm:inline-flex">
              Ctrl K
            </span>
          </div>

          <Link
            href="/favorites"
            aria-label="Favorites"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "shrink-0 rounded-xl border-border/80 bg-card",
              isFavoritesRoute
                ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-200 hover:bg-yellow-300/15 hover:text-yellow-100"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className={cn("size-4", isFavoritesRoute ? "fill-current" : "")} />
          </Link>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-border/80 bg-card text-foreground sm:hidden"
            onClick={() => setIsCreateCollectionDialogOpen(true)}
          >
            <FolderPlus className="size-4" />
            <span className="sr-only">New Collection</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="hidden rounded-xl border-border/80 bg-card text-foreground sm:inline-flex"
            onClick={() => setIsCreateCollectionDialogOpen(true)}
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

      <CreateItemDialog
        key={routeType ?? "default"}
        collectionOptions={collectionOptions}
        initialType={routeType ?? "snippet"}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <CreateCollectionDialog
        open={isCreateCollectionDialogOpen}
        onOpenChange={setIsCreateCollectionDialogOpen}
      />
    </>
  );
}

function getCurrentItemType(pathname: string) {
  const match = /^\/items\/([^/]+)/.exec(pathname);

  if (!match) {
    return null;
  }

  return normalizeDashboardItemTypeRouteKey(decodeURIComponent(match[1]));
}
