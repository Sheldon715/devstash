"use client";

import { useEffect, useRef, useState } from "react";
import { FilePlus2, FolderPlus, LayoutPanelLeft, Plus, Search, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const routeType = getCurrentItemType(pathname);
  const isFavoritesRoute = pathname === "/favorites";

  useEffect(() => {
    if (!isCreateMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        createMenuRef.current &&
        event.target instanceof Node &&
        !createMenuRef.current.contains(event.target)
      ) {
        setIsCreateMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateMenuOpen]);

  function openCreateItemDialog() {
    setIsCreateMenuOpen(false);
    setIsCreateDialogOpen(true);
  }

  function openCreateCollectionDialog() {
    setIsCreateMenuOpen(false);
    setIsCreateCollectionDialogOpen(true);
  }

  return (
    <>
      <div className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[980px] items-center gap-2 px-4 py-3 sm:px-6 md:gap-3 lg:px-8 xl:px-12 2xl:max-w-[1040px] 2xl:px-16">
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

          <div className="relative min-w-0 flex-1 xl:max-w-[560px] 2xl:max-w-[600px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search items"
              placeholder="Search"
              readOnly
              className="h-11 cursor-pointer rounded-xl border-border/80 bg-card pl-9 pr-3 md:pr-20"
              onClick={onOpenSearchPalette}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/80 bg-background px-2 py-1 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase md:inline-flex">
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

          <div ref={createMenuRef} className="relative shrink-0 md:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-expanded={isCreateMenuOpen}
              aria-haspopup="menu"
              className="rounded-xl border-border/80 bg-card text-foreground"
              onClick={() => setIsCreateMenuOpen((current) => !current)}
            >
              <Plus className="size-4" />
              <span className="sr-only">Create new</span>
            </Button>

            <div
              className={cn(
                "absolute right-0 top-12 z-30 w-48 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12] p-1.5 opacity-0 shadow-[0_18px_48px_rgba(0,0,0,0.35)] ring-1 ring-black/20 transition-all duration-200 ease-out",
                isCreateMenuOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-1 scale-95",
              )}
              aria-hidden={!isCreateMenuOpen}
              role="menu"
              aria-label="Create actions"
            >
              <CreateMenuAction
                icon={FilePlus2}
                label="New Item"
                tabIndex={isCreateMenuOpen ? 0 : -1}
                onClick={openCreateItemDialog}
              />
              <CreateMenuAction
                icon={FolderPlus}
                label="New Collection"
                tabIndex={isCreateMenuOpen ? 0 : -1}
                onClick={openCreateCollectionDialog}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="hidden rounded-xl border-border/80 bg-card text-foreground md:inline-flex"
            onClick={openCreateCollectionDialog}
          >
            <FolderPlus className="size-4" />
            New Collection
          </Button>

          <Button
            type="button"
            className="hidden rounded-xl bg-foreground text-background hover:bg-foreground/90 md:inline-flex"
            onClick={openCreateItemDialog}
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

interface CreateMenuActionProps {
  icon: LucideIcon;
  label: string;
  tabIndex: number;
  onClick: () => void;
}

function CreateMenuAction({
  icon: Icon,
  label,
  onClick,
  tabIndex,
}: CreateMenuActionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={tabIndex}
      onClick={onClick}
      className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-zinc-50"
    >
      <Icon className="size-4 shrink-0 text-zinc-500" />
      <span>{label}</span>
    </button>
  );
}

function getCurrentItemType(pathname: string) {
  const match = /^\/items\/([^/]+)/.exec(pathname);

  if (!match) {
    return null;
  }

  return normalizeDashboardItemTypeRouteKey(decodeURIComponent(match[1]));
}
