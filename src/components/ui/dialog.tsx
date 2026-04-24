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

interface DialogContextValue {
  descriptionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("Dialog components must be used within Dialog.");
  }

  return context;
}

export function Dialog({
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
    <DialogContext.Provider
      value={{
        descriptionId,
        open,
        onOpenChange,
        titleId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { descriptionId, onOpenChange, open, titleId } = useDialogContext();
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      previousActiveElementRef.current?.focus();
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[170] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#090a0e] text-zinc-50 shadow-[0_28px_90px_rgba(0,0,0,0.52)]",
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

export function DialogHeader({
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

export function DialogFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();

  return createElement(
    "h2",
    {
      id: titleId,
      className: cn("text-xl font-semibold tracking-tight text-zinc-50", className),
      ...props,
    },
    children,
  );
}

export function DialogDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();

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

export function DialogClose({
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialogContext();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.08]",
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

function getFocusableElements(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}
