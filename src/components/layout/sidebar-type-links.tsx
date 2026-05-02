"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  DashboardNamedIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import type { DashboardSidebarItemTypeRecord } from "@/lib/db/items";
import { getDashboardItemTypeRouteSegment } from "@/lib/item-types";
import { getSidebarContentVisibilityClass } from "@/components/layout/sidebar-utils";
import { cn } from "@/lib/utils";

interface SidebarTypeLinksProps {
  isCollapsed: boolean;
  isPro: boolean;
  onCloseMobile: () => void;
  pathname: string;
  sidebarItemTypes: DashboardSidebarItemTypeRecord[];
}

export function SidebarTypeLinks({
  isCollapsed,
  isPro,
  onCloseMobile,
  pathname,
  sidebarItemTypes,
}: SidebarTypeLinksProps) {
  return (
    <SidebarSection
      title="Types"
      isCollapsed={isCollapsed}
      className="border-b border-white/6 px-3.5 py-[clamp(10px,1.6vh,20px)]"
    >
      {sidebarItemTypes.map((itemType) => {
        const isProType = itemType.key === "file" || itemType.key === "image";
        const itemTypeHref = `/items/${getDashboardItemTypeRouteSegment(itemType.typeKey)}`;
        const href = isProType && !isPro ? "/upgrade" : itemTypeHref;
        const iconColor = getDashboardItemTypeColor(itemType.typeKey);
        const isActive = pathname === href;

        return (
          <Link
            key={itemType.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-transparent px-2.5 py-[clamp(6px,0.85vh,9px)] transition-all duration-300 hover:border-white/8 hover:bg-white/[0.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]",
              isActive &&
                "border-sky-300/20 bg-sky-300/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sky-300",
              isCollapsed && "justify-center",
            )}
            onClick={onCloseMobile}
          >
            <div
              className={cn(
                "flex size-[clamp(22px,2.8vh,28px)] shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:brightness-110",
                isActive && "bg-white/[0.04]",
                iconColor,
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
  );
}

function SidebarSection({
  children,
  className,
  isCollapsed,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  isCollapsed: boolean;
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
      </div>

      <div className="space-y-1">{children}</div>
    </section>
  );
}
