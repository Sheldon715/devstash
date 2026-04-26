"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { EditorPreferencesProvider } from "@/components/items/editor-preferences-context";
import { ItemDrawerProvider } from "@/components/items/item-drawer-provider";
import type { CollectionOption } from "@/components/items/collection-multi-select";
import { GlobalSearchCommandPalette } from "@/components/layout/global-search-command-palette";
import { Sidebar } from "@/components/layout/sidebar";
import type { SidebarCurrentUser } from "@/components/layout/sidebar-user-menu";
import { TopBar } from "@/components/layout/top-bar";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import type { DashboardSidebarItemTypeRecord } from "@/lib/db/items";
import type { DashboardSearchData } from "@/lib/db/search";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";

interface DashboardShellProps {
  children: ReactNode;
  collectionOptions: CollectionOption[];
  currentUser: SidebarCurrentUser;
  editorPreferences?: EditorPreferences;
  favoriteCollections: DashboardCollectionCardRecord[];
  recentCollections: DashboardCollectionCardRecord[];
  searchData: DashboardSearchData;
  sidebarItemTypes: DashboardSidebarItemTypeRecord[];
}

export function DashboardShell({
  children,
  collectionOptions,
  currentUser,
  editorPreferences = DEFAULT_EDITOR_PREFERENCES,
  favoriteCollections,
  recentCollections,
  searchData,
  sidebarItemTypes,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    function updateSidebarMode() {
      if (mediaQuery.matches) {
        setIsSidebarOpen(false);
      }
    }

    updateSidebarMode();
    mediaQuery.addEventListener("change", updateSidebarMode);

    return () => {
      mediaQuery.removeEventListener("change", updateSidebarMode);
    };
  }, []);

  function handleSidebarCollapse() {
    setIsSidebarCollapsed((current) => !current);
  }

  function handleSidebarClose() {
    setIsSidebarOpen(false);
  }

  function handleSidebarOpen() {
    setIsSidebarOpen(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar
          currentUser={currentUser}
          favoriteCollections={favoriteCollections}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isSidebarOpen}
          onCloseMobile={handleSidebarClose}
          onToggleCollapsed={handleSidebarCollapse}
          recentCollections={recentCollections}
          sidebarItemTypes={sidebarItemTypes}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <EditorPreferencesProvider initialPreferences={editorPreferences}>
            <ItemDrawerProvider collectionOptions={collectionOptions}>
              <TopBar
                collectionOptions={collectionOptions}
                onOpenMobileSidebar={handleSidebarOpen}
                onOpenSearchPalette={() => setIsSearchPaletteOpen(true)}
              />

              <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px] 2xl:max-w-[1480px]">
                  {children}
                </div>
              </div>
              <GlobalSearchCommandPalette
                open={isSearchPaletteOpen}
                searchData={searchData}
                onOpenChange={setIsSearchPaletteOpen}
              />
            </ItemDrawerProvider>
          </EditorPreferencesProvider>
        </div>
      </div>
    </main>
  );
}
