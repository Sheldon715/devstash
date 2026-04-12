"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FolderOpen,
  LayoutPanelLeft,
  Settings,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getDashboardIconByName,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import { dashboardMockData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

const favoriteCollections = dashboardMockData.collections.filter(
  (collection) => collection.isFavorite
);

const recentCollections = [...dashboardMockData.collections]
  .sort((left, right) => {
    const leftLatest = getLatestCollectionUpdate(left.itemIds);
    const rightLatest = getLatestCollectionUpdate(right.itemIds);

    return rightLatest.localeCompare(leftLatest);
  })
  .slice(0, 4);

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isMobileOpen}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-border/70 bg-[#050507] transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          isCollapsed ? "w-[84px]" : "w-[248px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 min-h-[clamp(60px,8vh,78px)] items-center border-b border-white/6 py-[clamp(10px,1.4vh,16px)]",
            isCollapsed ? "justify-center px-2.5" : "justify-between px-3.5"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 overflow-hidden",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed ? (
              <>
                <div className="flex size-[clamp(32px,4vh,40px)] shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#5f7cff] via-[#6c52ff] to-[#8c4bff] text-white shadow-[0_10px_24px_rgba(99,102,241,0.28)]">
                  <div className="relative size-5">
                    <span className="absolute top-[1px] left-1/2 h-[6px] w-[14px] -translate-x-1/2 rounded-[2px] border border-white/90 bg-transparent" />
                    <span className="absolute top-[6px] left-1/2 h-[6px] w-[14px] -translate-x-1/2 rounded-[2px] border border-white/70 bg-transparent" />
                    <span className="absolute top-[11px] left-1/2 h-[6px] w-[14px] -translate-x-1/2 rounded-[2px] border border-white/50 bg-transparent" />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[clamp(13px,1.65vh,15px)] font-semibold tracking-tight text-zinc-50">
                    DevStash
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {isCollapsed ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden rounded-xl border-white/8 bg-white/[0.03] text-muted-foreground lg:inline-flex"
              onClick={onToggleCollapsed}
            >
              <LayoutPanelLeft className="size-4" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden rounded-xl border-white/8 bg-white/[0.03] text-muted-foreground lg:inline-flex"
                onClick={onToggleCollapsed}
              >
                <LayoutPanelLeft className="size-4" />
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

        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarSection
            title="Types"
            isCollapsed={isCollapsed}
            className="border-b border-white/6 px-3.5 py-[clamp(10px,1.6vh,20px)]"
          >
            {dashboardMockData.itemTypes.map((itemType) => {
              const Icon = getDashboardIconByName(itemType.icon);
              const iconColor = getDashboardItemTypeColor(itemType.key);

              return (
                <Link
                  key={itemType.id}
                  href={`/items/${itemType.key}`}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl py-[clamp(3px,0.6vh,6px)] transition-colors hover:text-white",
                    isCollapsed && "justify-center"
                  )}
                  onClick={onCloseMobile}
                >
                  <div
                    className={cn(
                      "flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center transition-colors group-hover:brightness-110",
                      iconColor
                    )}
                  >
                    <Icon className="size-[clamp(12px,1.8vh,16px)]" />
                  </div>

                  <div
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-between gap-2",
                      isCollapsed && "hidden"
                    )}
                  >
                    <span className="truncate text-[clamp(11px,1.45vh,13px)] font-medium text-zinc-100">
                      {itemType.name}
                    </span>
                    <span className="text-[clamp(10px,1.3vh,12px)] text-muted-foreground">
                      {itemType.totalItems}
                    </span>
                  </div>
                </Link>
              );
            })}
          </SidebarSection>

          <SidebarSection
            title="Collections"
            isCollapsed={isCollapsed}
            defaultOpen={isCollectionsOpen}
            onToggle={() => setIsCollectionsOpen((current) => !current)}
            className="px-3.5 py-[clamp(10px,1.6vh,20px)]"
          >
            {isCollectionsOpen ? (
              <>
                <div className="space-y-[clamp(4px,0.6vh,8px)]">
                  <div className={cn("px-2", isCollapsed && "hidden")}>
                    <p className="text-[clamp(9px,1.1vh,10px)] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
                      Favorites
                    </p>
                  </div>

                  {favoriteCollections.map((collection) => (
                    <CollectionLink
                      key={collection.id}
                      name={collection.name}
                      meta={String(collection.itemIds.length)}
                      isCollapsed={isCollapsed}
                      showStar
                    />
                  ))}
                </div>

                <div className="mt-[clamp(10px,1.5vh,20px)] space-y-[clamp(4px,0.6vh,8px)]">
                  <div className={cn("px-2", isCollapsed && "hidden")}>
                    <p className="text-[clamp(9px,1.1vh,10px)] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
                      Recent
                    </p>
                  </div>

                  {recentCollections.map((collection) => (
                    <CollectionLink
                      key={collection.id}
                      name={collection.name}
                      meta={String(collection.itemIds.length)}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </SidebarSection>
        </div>

        <div className="shrink-0 border-t border-white/6 px-3.5 py-[clamp(10px,1.4vh,14px)]">
          <div
            className={cn(
              "flex items-center gap-[clamp(6px,0.9vh,10px)]",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex size-[clamp(30px,3.6vh,40px)] shrink-0 items-center justify-center rounded-full bg-[#dedede] text-[clamp(9px,1.1vh,10px)] font-semibold text-black">
              {dashboardMockData.user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div className={cn("min-w-0 flex-1", isCollapsed && "hidden")}>
              <p className="truncate text-[clamp(11px,1.45vh,13px)] font-semibold text-zinc-50">
                {dashboardMockData.user.name}
              </p>
              <p className="truncate text-[clamp(10px,1.2vh,11px)] text-muted-foreground">
                {dashboardMockData.user.email}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "rounded-2xl border-transparent bg-transparent text-muted-foreground hover:bg-white/[0.04]",
                isCollapsed && "hidden"
              )}
            >
              <Settings className="size-4" />
              <span className="sr-only">Open settings</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface SidebarSectionProps {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  isCollapsed: boolean;
  onToggle?: () => void;
  title: string;
}

function SidebarSection({
  children,
  className,
  defaultOpen,
  isCollapsed,
  onToggle,
  title,
}: SidebarSectionProps) {
  return (
    <section className={cn("space-y-[clamp(6px,0.9vh,12px)]", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-2",
          isCollapsed && "justify-center"
        )}
      >
        <span
          className={cn(
            "text-[clamp(10px,1.3vh,12px)] font-medium text-muted-foreground",
            isCollapsed && "hidden"
          )}
        >
          {title}
        </span>
        {typeof defaultOpen === "boolean" && onToggle ? (
          <button
            type="button"
            className={cn(
              "text-muted-foreground transition-colors hover:text-foreground",
              isCollapsed && "hidden"
            )}
            onClick={onToggle}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                !defaultOpen && "-rotate-90"
              )}
            />
            <span className="sr-only">Toggle {title}</span>
          </button>
        ) : null}
      </div>

      <div className="space-y-1">{children}</div>
    </section>
  );
}

interface CollectionLinkProps {
  isCollapsed: boolean;
  meta: string;
  name: string;
  showStar?: boolean;
}

function CollectionLink({
  isCollapsed,
  meta,
  name,
  showStar = false,
}: CollectionLinkProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl py-[clamp(3px,0.6vh,6px)] transition-colors hover:text-white",
        isCollapsed && "justify-center"
      )}
    >
      {!isCollapsed ? (
        <div className="flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center text-muted-foreground">
          <FolderOpen className="size-[clamp(12px,1.8vh,16px)]" />
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center justify-between gap-2",
          isCollapsed && "hidden"
        )}
      >
        <p className="truncate text-[clamp(11px,1.45vh,13px)] font-medium text-zinc-100">
          {name}
        </p>
        {showStar ? (
          <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
        ) : (
          <span className="text-[clamp(10px,1.3vh,12px)] text-muted-foreground">
            {meta}
          </span>
        )}
      </div>
    </div>
  );
}

function getLatestCollectionUpdate(itemIds: string[]) {
  return itemIds
    .map((itemId) => dashboardMockData.items.find((item) => item.id === itemId)?.updatedAt ?? "")
    .sort((left, right) => right.localeCompare(left))[0];
}
