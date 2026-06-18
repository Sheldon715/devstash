"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountModalShellProps {
  children: ReactNode;
  closeLabel: string;
  description?: ReactNode;
  eyebrow?: string;
  maxWidthClassName?: string;
  onClose: () => void;
  title: ReactNode;
  titleId: string;
}

export function AccountModalShell({
  children,
  closeLabel,
  description,
  eyebrow,
  maxWidthClassName = "max-w-3xl",
  onClose,
  title,
  titleId,
}: AccountModalShellProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="account-dialog-overlay-enter fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(5,6,10,0.78)] px-4 py-8 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "account-dialog-panel-enter w-full rounded-[2rem] border border-white/10 bg-[#090a0e] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.7)] sm:p-8",
          maxWidthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h3 id={titleId} className={cn("text-3xl font-semibold tracking-tight text-zinc-50", eyebrow && "mt-3")}>
              {title}
            </h3>
            {description ? (
              <div className="mt-3 text-sm leading-6 text-zinc-300 sm:text-base">{description}</div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">{closeLabel}</span>
          </Button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
