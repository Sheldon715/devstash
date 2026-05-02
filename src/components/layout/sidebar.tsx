"use client";

import Link from "next/link";
import { LayoutDashboard, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { getSidebarContentVisibilityClass } from "@/components/layout/sidebar-utils";
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
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;

    document.body.style.overflow = "hidden";
    sidebarRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseMobile();
        return;
      }

      if (event.key !== "Tab" || !sidebarRef.current) {
        return;
      }

      const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [isMobileOpen, onCloseMobile]);

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
        ref={sidebarRef}
        aria-label="Workspace navigation"
        aria-modal={isMobileOpen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-border/70 bg-[#050507] transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          isCollapsed ? "w-[84px]" : "w-[248px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role={isMobileOpen ? "dialog" : "complementary"}
        tabIndex={isMobileOpen ? -1 : undefined}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          onCloseMobile={onCloseMobile}
          onToggleCollapsed={onToggleCollapsed}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarPrimaryLinks
            isCollapsed={isCollapsed}
            onCloseMobile={onCloseMobile}
            pathname={pathname}
          />

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
          <SidebarUserMenu
            currentUser={currentUser}
            isCollapsed={isCollapsed}
            pathname={pathname}
          />
        </div>
      </aside>
    </>
  );
}

function SidebarPrimaryLinks({
  isCollapsed,
  onCloseMobile,
  pathname,
}: {
  isCollapsed: boolean;
  onCloseMobile: () => void;
  pathname: string;
}) {
  const links = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      label: "Dashboard",
    },
    {
      href: "/favorites",
      icon: Star,
      isActive: pathname === "/favorites",
      label: "Favorites",
    },
  ];

  return (
    <section className="space-y-[clamp(6px,0.9vh,12px)] border-b border-white/6 px-3.5 py-[clamp(10px,1.6vh,20px)]">
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
          Workspace
        </span>
      </div>

      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-transparent px-2.5 py-[clamp(6px,0.85vh,9px)] transition-all duration-300 hover:border-white/8 hover:bg-white/[0.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
                link.isActive &&
                  "border-sky-300/20 bg-sky-300/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sky-300",
                isCollapsed && "justify-center",
              )}
              onClick={onCloseMobile}
            >
              <div
                className={cn(
                  "flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 group-hover:text-zinc-50",
                  link.isActive && "bg-white/[0.05] text-sky-200",
                )}
              >
                <Icon className="size-[clamp(12px,1.8vh,16px)]" />
              </div>

              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  getSidebarContentVisibilityClass(isCollapsed),
                )}
              >
                <span className="truncate text-[clamp(11px,1.45vh,13px)] font-medium text-zinc-100">
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
