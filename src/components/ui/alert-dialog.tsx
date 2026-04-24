"use client";

import {
  createContext,
  createElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface AlertDialogContextValue {
  descriptionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);

  if (!context) {
    throw new Error("AlertDialog components must be used within AlertDialog.");
  }

  return context;
}

export function AlertDialog({
  children,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <AlertDialogContext.Provider
      value={{
        descriptionId,
        open,
        onOpenChange,
        titleId,
      }}
    >
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { descriptionId, onOpenChange, open, titleId } = useAlertDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab" || !contentRef.current) {
        return;
      }

      event.stopPropagation();

      const focusableElements = getFocusableElements(contentRef.current);

      if (!focusableElements.length) {
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
      const focusableElements = contentRef.current
        ? getFocusableElements(contentRef.current)
        : [];

      if (focusableElements.length) {
        focusableElements[0].focus();
        return;
      }

      contentRef.current?.focus();
    });

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      previousActiveElementRef.current?.focus();
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[190] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        tabIndex={-1}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        ref={contentRef}
        role="alertdialog"
        aria-modal="true"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#090a0e] p-6 text-zinc-50 shadow-[0_28px_90px_rgba(0,0,0,0.52)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function AlertDialogHeader({
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

export function AlertDialogFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useAlertDialogContext();

  return createElement(
    "h2",
    {
      id: titleId,
      className: cn("text-lg font-semibold tracking-tight text-zinc-50", className),
      ...props,
    },
    children,
  );
}

export function AlertDialogDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useAlertDialogContext();

  return createElement(
    "p",
    {
      id: descriptionId,
      className: cn("text-sm leading-6 text-zinc-300", className),
      ...props,
    },
    children,
  );
}

export function AlertDialogCancel({
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useAlertDialogContext();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.08]",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-300 px-4 text-sm font-medium text-black transition-colors hover:bg-rose-200 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

function getFocusableElements(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}
