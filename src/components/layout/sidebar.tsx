"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { SidebarCollections } from "@/components/layout/sidebar-collections";
import { SidebarHeader } from "@/components/layout/sidebar-header";
import { SidebarTypeLinks } from "@/components/layout/sidebar-type-links";
import {
  SidebarUserMenu,
  type SidebarCurrentUser,
} from "@/components/layout/sidebar-user-menu";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import type { DashboardSidebarItemTypeRecord } from "@/lib/db/items";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isMobileOpen}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-border/70 bg-[#050507] transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          isCollapsed ? "w-[84px]" : "w-[248px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          onCloseMobile={onCloseMobile}
          onToggleCollapsed={onToggleCollapsed}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarTypeLinks
            isCollapsed={isCollapsed}
            onCloseMobile={onCloseMobile}
            pathname={pathname}
            sidebarItemTypes={sidebarItemTypes}
          />

          <SidebarCollections
            favoriteCollections={favoriteCollections}
            isCollapsed={isCollapsed}
            isOpen={isCollectionsOpen}
            onCloseMobile={onCloseMobile}
            onToggle={() => setIsCollectionsOpen((current) => !current)}
            pathname={pathname}
            recentCollections={recentCollections}
          />
        </div>

        <div className="shrink-0 border-t border-white/6 px-3.5 py-[clamp(10px,1.4vh,14px)]">
          <SidebarUserMenu currentUser={currentUser} isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
