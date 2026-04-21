"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronsLeft, ChevronsRight, FolderOpen, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import type { DashboardSidebarItemTypeRecord } from "@/lib/db/items";
import {
  SidebarUserMenu,
  type SidebarCurrentUser,
} from "@/components/layout/sidebar-user-menu";
import {
  DashboardNamedIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import { cn } from "@/lib/utils";

function getSidebarContentVisibilityClass(isCollapsed: boolean) {
  return isCollapsed
    ? "pointer-events-none w-0 max-w-0 -translate-x-2 opacity-0"
    : "w-auto max-w-[220px] translate-x-0 opacity-100";
}

interface SidebarProps {
  currentUser: SidebarCurrentUser;
  favoriteCollections: DashboardCollectionCardRecord[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  recentCollections: DashboardCollectionCardRecord[];
  sidebarItemTypes: DashboardSidebarItemTypeRecord[];
}

export function Sidebar({
  currentUser,
  favoriteCollections,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapsed,
  recentCollections,
  sidebarItemTypes,
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
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-border/70 bg-[#050507] transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
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
              "flex items-center gap-2.5 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed ? (
              <>
                <div className="flex size-[clamp(32px,4vh,40px)] shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-gradient-to-br from-[#24193f] via-[#19122d] to-[#120d20] text-white shadow-[0_10px_24px_rgba(18,13,32,0.34)]">
                  <span className="text-[15px] font-semibold tracking-[-0.04em] text-[#ddd4ff]">
                    D
                  </span>
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
          </div>

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

        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarSection
            title="Types"
            isCollapsed={isCollapsed}
            className="border-b border-white/6 px-3.5 py-[clamp(10px,1.6vh,20px)]"
          >
            {sidebarItemTypes.map((itemType) => {
              const iconColor = getDashboardItemTypeColor(itemType.typeKey);
              const isProType = itemType.key === "file" || itemType.key === "image";

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
                    <DashboardNamedIcon
                      iconName={itemType.icon}
                      className="size-[clamp(12px,1.8vh,16px)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      getSidebarContentVisibilityClass(isCollapsed),
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[clamp(11px,1.45vh,13px)] font-medium text-zinc-100">
                        {itemType.name}
                      </span>
                      {isProType ? (
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-white/[0.04] text-[8px] text-zinc-300"
                        >
                          PRO
                        </Badge>
                      ) : null}
                    </div>
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
                  <div
                    className={cn(
                      "overflow-hidden px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      getSidebarContentVisibilityClass(isCollapsed),
                    )}
                  >
                    <p className="text-[clamp(9px,1.1vh,10px)] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
                      Favorites
                    </p>
                  </div>

                  {favoriteCollections.map((collection) => (
                    <CollectionLink
                      key={collection.id}
                      itemCount={collection.itemCount}
                      name={collection.name}
                      isCollapsed={isCollapsed}
                      showStar
                    />
                  ))}
                </div>

                <div className="mt-[clamp(10px,1.5vh,20px)] space-y-[clamp(4px,0.6vh,8px)]">
                  <div
                    className={cn(
                      "overflow-hidden px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      getSidebarContentVisibilityClass(isCollapsed),
                    )}
                  >
                    <p className="text-[clamp(9px,1.1vh,10px)] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
                      Recent
                    </p>
                  </div>

                  {recentCollections.map((collection) => (
                    <CollectionLink
                      key={collection.id}
                      dominantTypeKey={collection.dominantTypeKey}
                      itemCount={collection.itemCount}
                      name={collection.name}
                      isCollapsed={isCollapsed}
                    />
                  ))}

                  <div
                    className={cn(
                      "overflow-hidden px-2 pt-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      getSidebarContentVisibilityClass(isCollapsed),
                    )}
                  >
                    <Link
                      href="/collections"
                      className="text-[clamp(10px,1.3vh,12px)] font-medium text-muted-foreground transition-colors hover:text-zinc-50"
                      onClick={onCloseMobile}
                    >
                      View all collections
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </SidebarSection>
        </div>

        <div className="shrink-0 border-t border-white/6 px-3.5 py-[clamp(10px,1.4vh,14px)]">
          <SidebarUserMenu currentUser={currentUser} isCollapsed={isCollapsed} />
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
          "flex items-center justify-between px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed && "justify-center"
        )}
      >
        <span
          className={cn(
            "overflow-hidden text-[clamp(10px,1.3vh,12px)] font-medium text-muted-foreground transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
            getSidebarContentVisibilityClass(isCollapsed),
          )}
        >
          {title}
        </span>
        {typeof defaultOpen === "boolean" && onToggle ? (
          <button
            type="button"
            className={cn(
              "text-muted-foreground transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground",
              getSidebarContentVisibilityClass(isCollapsed),
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
  dominantTypeKey?: DashboardCollectionCardRecord["dominantTypeKey"];
  isCollapsed: boolean;
  itemCount: number;
  name: string;
  showStar?: boolean;
}

function CollectionLink({
  dominantTypeKey,
  isCollapsed,
  itemCount,
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
      <div className="flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center text-muted-foreground">
        {showStar ? (
          <FolderOpen className="size-[clamp(12px,1.8vh,16px)]" />
        ) : (
          <span
            className={cn(
              "size-2.5 rounded-full bg-current",
              dominantTypeKey
                ? getDashboardItemTypeColor(dominantTypeKey)
                : "text-muted-foreground/60"
            )}
          />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          getSidebarContentVisibilityClass(isCollapsed),
        )}
      >
        <p className="truncate text-[clamp(11px,1.45vh,13px)] font-medium text-zinc-100">
          {name}
        </p>
        {showStar ? (
          <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
        ) : (
          <span className="text-[clamp(10px,1.3vh,12px)] text-muted-foreground">
            {itemCount}
          </span>
        )}
      </div>
    </div>
  );
}
