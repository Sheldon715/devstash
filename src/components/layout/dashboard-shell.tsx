"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isSidebarOpen}
          onCloseMobile={handleSidebarClose}
          onToggleCollapsed={handleSidebarCollapse}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileSidebar={handleSidebarOpen} />

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
