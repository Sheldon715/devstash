"use client";

import {
  createContext,
  createElement,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface SheetContextValue {
  contentId: string;
  descriptionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);

  if (!context) {
    throw new Error("Sheet components must be used within Sheet.");
  }

  return context;
}

export function Sheet({
  children,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentId = useId();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <SheetContext.Provider
      value={{
        contentId,
        descriptionId,
        open,
        onOpenChange,
        titleId,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}

export function SheetContent({
  children,
  className,
  side = "right",
}: HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right";
}) {
  const { contentId, descriptionId, onOpenChange, open, titleId } = useSheetContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab" || !contentRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(contentRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        contentRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (activeElement === firstElement || activeElement === contentRef.current) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      const contentElement = contentRef.current;

      if (!contentElement) {
        return;
      }

      const focusableElements = getFocusableElements(contentElement);

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }

      contentElement.focus();
    });

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const sideClasses =
    side === "left"
      ? "left-0 border-r border-white/10 sheet-content-enter-left"
      : "right-0 border-l border-white/10 sheet-content-enter-right";

  return createPortal(
    <div className="fixed inset-0 z-[140]">
      <button
        type="button"
        aria-label="Close sheet"
        tabIndex={-1}
        className="sheet-overlay-enter absolute inset-0 bg-[rgba(3,4,8,0.72)] backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        id={contentId}
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "fixed top-0 flex h-[100dvh] w-full max-w-[42rem] flex-col overflow-hidden bg-[#07090d] shadow-[0_30px_120px_rgba(0,0,0,0.58)]",
          sideClasses,
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function getFocusableElements(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}

export function SheetHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export function SheetTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useSheetContext();

  return createElement(
    "h2",
    {
      id: titleId,
      className: cn("text-2xl font-semibold tracking-tight text-zinc-50", className),
      ...props,
    },
    children,
  );
}

export function SheetDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useSheetContext();

  return createElement(
    "p",
    {
      id: descriptionId,
      className: cn("text-sm leading-6 text-zinc-400", className),
      ...props,
    },
    children,
  );
}
