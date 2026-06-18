"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, FolderOpen, Star } from "lucide-react";

import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import { getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import { getSidebarContentVisibilityClass } from "@/components/layout/sidebar-utils";
import { cn } from "@/lib/utils";

interface SidebarCollectionsProps {
  favoriteCollections: DashboardCollectionCardRecord[];
  isCollapsed: boolean;
  isOpen: boolean;
  onCloseMobile: () => void;
  onToggle: () => void;
  pathname: string;
  recentCollections: DashboardCollectionCardRecord[];
}

export function SidebarCollections({
  favoriteCollections,
  isCollapsed,
  isOpen,
  onCloseMobile,
  onToggle,
  pathname,
  recentCollections,
}: SidebarCollectionsProps) {
  const hasFavoriteCollections = favoriteCollections.length > 0;
  const hasRecentCollections = recentCollections.length > 0;

  return (
    <SidebarSection
      title="Collections"
      isCollapsed={isCollapsed}
      defaultOpen={isOpen}
      onToggle={onToggle}
      className="px-3.5 py-[clamp(10px,1.6vh,20px)]"
    >
      {isOpen ? (
        <>
          {hasFavoriteCollections ? (
            <div className="space-y-[clamp(4px,0.6vh,8px)]">
              <CollectionGroupLabel label="Favorites" isCollapsed={isCollapsed} />

              {favoriteCollections.map((collection) => (
                <CollectionLink
                  key={collection.id}
                  collectionId={collection.id}
                  itemCount={collection.itemCount}
                  name={collection.name}
                  isCollapsed={isCollapsed}
                  onCloseMobile={onCloseMobile}
                  pathname={pathname}
                  showStar
                />
              ))}
            </div>
          ) : null}

          <div
            className={cn(
              "space-y-[clamp(4px,0.6vh,8px)]",
              hasFavoriteCollections && "mt-[clamp(10px,1.5vh,20px)]",
            )}
          >
            {hasRecentCollections ? (
              <CollectionGroupLabel label="Recent" isCollapsed={isCollapsed} />
            ) : null}

            {recentCollections.map((collection) => (
              <CollectionLink
                key={collection.id}
                collectionId={collection.id}
                dominantTypeKey={collection.dominantTypeKey}
                itemCount={collection.itemCount}
                name={collection.name}
                isCollapsed={isCollapsed}
                onCloseMobile={onCloseMobile}
                pathname={pathname}
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
                aria-current={pathname === "/collections" ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-lg px-2 py-1.5 text-[clamp(10px,1.3vh,12px)] font-medium text-muted-foreground transition-all duration-300 hover:bg-white/[0.045] hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
                  pathname === "/collections" && "bg-white/[0.06] text-zinc-50",
                )}
                onClick={onCloseMobile}
              >
                View all collections
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </SidebarSection>
  );
}

function CollectionGroupLabel({
  isCollapsed,
  label,
}: {
  isCollapsed: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        getSidebarContentVisibilityClass(isCollapsed),
      )}
    >
      <p className="text-[clamp(9px,1.1vh,10px)] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
        {label}
      </p>
    </div>
  );
}

function SidebarSection({
  children,
  className,
  defaultOpen,
  isCollapsed,
  onToggle,
  title,
}: {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  isCollapsed: boolean;
  onToggle?: () => void;
  title: string;
}) {
  return (
    <section className={cn("space-y-[clamp(6px,0.9vh,12px)]", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed && "justify-center",
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
                !defaultOpen && "-rotate-90",
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

function CollectionLink({
  collectionId,
  dominantTypeKey,
  isCollapsed,
  itemCount,
  name,
  onCloseMobile,
  pathname,
  showStar = false,
}: {
  collectionId: string;
  dominantTypeKey?: DashboardCollectionCardRecord["dominantTypeKey"];
  isCollapsed: boolean;
  itemCount: number;
  name: string;
  onCloseMobile: () => void;
  pathname: string;
  showStar?: boolean;
}) {
  const href = `/collections/${collectionId}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onCloseMobile}
      className={cn(
        "group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-transparent px-2.5 py-[clamp(6px,0.85vh,9px)] transition-all duration-300 hover:border-white/8 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
        isCollapsed && "justify-center",
        isActive &&
          "border-sky-300/20 bg-sky-300/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sky-300",
      )}
    >
      <div className="flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 group-hover:bg-white/[0.04]">
        {showStar ? (
          <FolderOpen className="size-[clamp(12px,1.8vh,16px)]" />
        ) : (
          <span
            className={cn(
              "size-2.5 rounded-full bg-current",
              dominantTypeKey
                ? getDashboardItemTypeColor(dominantTypeKey)
                : "text-muted-foreground/60",
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
    </Link>
  );
}
