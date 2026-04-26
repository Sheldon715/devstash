import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import type { PaginationState } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  basePath: string;
  pagination: PaginationState;
}

export function PaginationControls({ basePath, pagination }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Page {pagination.currentPage} of {pagination.totalPages}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <PaginationLink
          disabled={!pagination.hasPreviousPage}
          href={getPageHref(basePath, pagination.currentPage - 1)}
          label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span>Prev</span>
        </PaginationLink>

        {pages.map((page) => (
          <PaginationLink
            aria-current={page === pagination.currentPage ? "page" : undefined}
            href={getPageHref(basePath, page)}
            key={page}
            label={`Page ${page}`}
            selected={page === pagination.currentPage}
          >
            {page}
          </PaginationLink>
        ))}

        <PaginationLink
          disabled={!pagination.hasNextPage}
          href={getPageHref(basePath, pagination.currentPage + 1)}
          label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="size-4" />
        </PaginationLink>
      </div>
    </nav>
  );
}

interface PaginationLinkProps {
  "aria-current"?: "page";
  children: ReactNode;
  disabled?: boolean;
  href: string;
  label: string;
  selected?: boolean;
}

function PaginationLink({
  "aria-current": ariaCurrent,
  children,
  disabled = false,
  href,
  label,
  selected = false,
}: PaginationLinkProps) {
  const className = cn(
    buttonVariants({
      size: "sm",
      variant: selected ? "default" : "outline",
    }),
    "min-w-9 border-white/10",
    disabled && "pointer-events-none border-white/5 text-muted-foreground/45 opacity-50",
  );

  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link aria-current={ariaCurrent} aria-label={label} className={className} href={href}>
      {children}
    </Link>
  );
}

function getPageHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
